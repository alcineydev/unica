import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { compare, hash } from 'bcryptjs'

// GET - Listar usuários
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json({
      total: users.length,
      users
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST - Testar login ou resetar senha
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, action } = body

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'Usuário não encontrado',
        email 
      }, { status: 404 })
    }

    // Ação: resetar senha
    if (action === 'reset') {
      const newPassword = password || 'admin123456'
      const hashedPassword = await hash(newPassword, 12)
      
      await prisma.user.update({
        where: { email },
        data: { 
          password: hashedPassword,
          isActive: true,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Senha resetada e usuário ativado',
        email,
        newPassword
      })
    }

    // Ação: testar senha
    if (action === 'test' && password) {
      const isValid = await compare(password, user.password)
      
      return NextResponse.json({
        email,
        isActive: user.isActive,
        role: user.role,
        passwordValid: isValid,
        hasPassword: !!user.password,
        passwordLength: user.password?.length
      })
    }

    // Ação: apenas info
    return NextResponse.json({
      email,
      id: user.id,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.password,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

