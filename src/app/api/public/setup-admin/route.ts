import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'

// GET - Criar admin ao acessar a URL
export async function GET() {
  try {
    const email = 'admin@unicabeneficios.com.br'
    const password = 'admin123456'
    const hashedPassword = await hash(password, 12)

    // Verificar se já existe
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      // Atualizar senha e ativar
      await prisma.user.update({
        where: { email },
        data: { 
          password: hashedPassword,
          isActive: true,
          role: 'ADMIN',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: '✅ Usuário já existia - senha resetada para admin123456',
        email,
        password: 'admin123456',
        action: 'UPDATED'
      })
    }

    // Criar novo usuário
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
        name: 'Admin UNICA',
        phone: '66999999999',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: '✅ Usuário ADMIN criado com sucesso!',
      email,
      password: 'admin123456',
      userId: user.id,
      action: 'CREATED'
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: String(error) 
    }, { status: 500 })
  }
}

