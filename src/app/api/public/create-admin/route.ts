import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'

// POST - Criar usuário admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email e password são obrigatórios' 
      }, { status: 400 })
    }

    // Verificar se já existe
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      // Atualizar senha e ativar
      const hashedPassword = await hash(password, 12)
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
        message: 'Usuário já existia - senha resetada e ativado',
        email,
        password
      })
    }

    // Criar novo usuário
    const hashedPassword = await hash(password, 12)
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8)

    const user = await prisma.user.create({
      data: {
        id: `user-admin-${uniqueId}`,
        email,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Criar Admin associado
    await prisma.admin.create({
      data: {
        id: `admin-${uniqueId}`,
        userId: user.id,
        name: name || 'Admin UNICA',
        phone: '66999999999',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Usuário ADMIN criado com sucesso',
      email,
      password,
      userId: user.id
    })

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

