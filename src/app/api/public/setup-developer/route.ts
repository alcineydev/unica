import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash, compare } from 'bcryptjs'

export async function GET() {
  try {
    const email = 'dev@unicabeneficios.com.br'
    const password = 'Dev@2026!'
    const hashedPassword = await hash(password, 12)

    // Verificar se existe
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      // Testar senha atual
      const passwordMatch = await compare(password, existing.password)
      
      // Atualizar para garantir que está correto
      await prisma.user.update({
        where: { email },
        data: { 
          password: hashedPassword,
          isActive: true,
          role: 'DEVELOPER',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        status: 'ATUALIZADO',
        message: '✅ Usuário DEVELOPER atualizado!',
        usuario: {
          id: existing.id,
          email: existing.email,
          role: 'DEVELOPER',
          isActive: true,
          senhaAnteriorCorreta: passwordMatch
        },
        credenciais: {
          email: email,
          senha: password
        },
        instrucao: 'Agora acesse /login e use estas credenciais'
      })
    }

    // Criar novo usuário DEVELOPER
    const userId = `user-dev-prod-${Date.now()}`

    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        password: hashedPassword,
        role: 'DEVELOPER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      status: 'CRIADO',
      message: '✅ Usuário DEVELOPER criado!',
      usuario: {
        id: user.id,
        email: user.email,
        role: 'DEVELOPER',
        isActive: true
      },
      credenciais: {
        email: email,
        senha: password
      },
      instrucao: 'Agora acesse /login e use estas credenciais'
    })

  } catch (error) {
    return NextResponse.json({ 
      status: 'ERRO',
      error: String(error) 
    }, { status: 500 })
  }
}
