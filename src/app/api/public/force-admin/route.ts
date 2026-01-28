import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'

// GET - Forçar criação/reset do admin ao acessar
export async function GET() {
  try {
    const email = 'admin@unicabeneficios.com.br'
    const password = 'Admin@2026!'
    const hashedPassword = await hash(password, 12)

    // Verificar se existe
    const existing = await prisma.user.findUnique({
      where: { email },
      include: { admin: true }
    })

    if (existing) {
      // Atualizar TUDO
      await prisma.user.update({
        where: { email },
        data: { 
          password: hashedPassword,
          isActive: true,
          role: 'ADMIN',
          updatedAt: new Date()
        }
      })

      // Criar admin se não existir
      if (!existing.admin) {
        await prisma.admin.create({
          data: {
            id: `admin-${Date.now()}`,
            userId: existing.id,
            name: 'Admin UNICA',
            phone: '66999999999',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      }

      return NextResponse.json({
        success: true,
        message: '✅ Senha resetada e usuário ativado!',
        credenciais: {
          email: email,
          senha: password
        },
        instrucao: 'Agora acesse /login e use estas credenciais'
      })
    }

    // Criar novo
    const userId = `user-admin-prod-${Date.now()}`

    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    await prisma.admin.create({
      data: {
        id: `admin-${Date.now()}`,
        userId: user.id,
        name: 'Admin UNICA',
        phone: '66999999999',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: '✅ Usuário ADMIN criado!',
      credenciais: {
        email: email,
        senha: password
      },
      instrucao: 'Agora acesse /login e use estas credenciais'
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: String(error) 
    }, { status: 500 })
  }
}
