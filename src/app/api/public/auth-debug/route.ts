import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { compare, hash } from 'bcryptjs'

export async function GET() {
  try {
    const email = 'admin@unicabeneficios.com.br'
    const testPassword = 'Admin@2026!'
    
    // 1. Verificar conexão com banco
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`
    
    // 2. Verificar DATABASE_URL (mascarada)
    const dbUrl = process.env.DATABASE_URL || 'NÃO DEFINIDA'
    const maskedUrl = dbUrl.includes('@') 
      ? dbUrl.split('@')[1]?.substring(0, 30) + '...'
      : 'URL inválida'
    
    // 3. Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
      include: { admin: true }
    })

    if (!user) {
      return NextResponse.json({
        status: 'ERRO',
        problema: 'Usuário NÃO encontrado no banco',
        database: maskedUrl,
        conexao: 'OK',
        solucao: 'O banco de PROD pode estar diferente'
      })
    }

    // 4. Testar senha
    const passwordMatch = await compare(testPassword, user.password)

    // 5. Verificar requisitos para login
    const problemas = []
    if (!user.isActive) problemas.push('Usuário INATIVO')
    if (!passwordMatch) problemas.push('Senha NÃO corresponde')
    if (!user.admin && user.role === 'ADMIN') problemas.push('Registro Admin não existe')
    if (user.role !== 'ADMIN' && user.role !== 'DEVELOPER') problemas.push(`Role incorreto: ${user.role}`)

    // 6. Se tem problemas, corrigir
    if (problemas.length > 0) {
      const newHashedPassword = await hash(testPassword, 12)
      
      await prisma.user.update({
        where: { email },
        data: {
          password: newHashedPassword,
          isActive: true,
          role: 'ADMIN',
          updatedAt: new Date()
        }
      })

      if (!user.admin) {
        await prisma.admin.upsert({
          where: { userId: user.id },
          create: {
            id: `admin-fix-${Date.now()}`,
            userId: user.id,
            name: 'Admin UNICA',
            phone: '66999999999',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          update: {
            name: 'Admin UNICA',
            updatedAt: new Date()
          }
        })
      }

      return NextResponse.json({
        status: 'CORRIGIDO',
        problemasEncontrados: problemas,
        correcoes: [
          'Senha atualizada',
          'isActive = true',
          'role = ADMIN',
          'Admin record criado/atualizado'
        ],
        credenciais: {
          email: email,
          senha: testPassword
        },
        database: maskedUrl,
        instrucao: 'Tente logar agora!'
      })
    }

    // 7. Tudo OK
    return NextResponse.json({
      status: 'OK',
      mensagem: 'Usuário configurado corretamente!',
      usuario: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        hasAdmin: !!user.admin,
        passwordMatch: passwordMatch
      },
      credenciais: {
        email: email,
        senha: testPassword
      },
      database: maskedUrl,
      instrucao: 'Deveria funcionar. Se não logar, o problema é no auth.'
    })

  } catch (error) {
    return NextResponse.json({ 
      status: 'ERRO',
      error: String(error),
      tipo: 'Erro de conexão ou execução'
    }, { status: 500 })
  }
}
