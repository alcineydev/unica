import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { compare, hash } from 'bcryptjs'

// GET - Ver todos os usuários admin
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'DEVELOPER'] }
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      total: users.length,
      users
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST - Verificar e corrigir usuário específico
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, action } = body

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { admin: true }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'Usuário NÃO encontrado',
        email 
      }, { status: 404 })
    }

    // Se ação é testar senha
    if (action === 'test' && password) {
      const isValid = await compare(password, user.password)
      return NextResponse.json({
        email: user.email,
        passwordValid: isValid,
        isActive: user.isActive,
        role: user.role,
        hasAdmin: !!user.admin
      })
    }

    // Se ação é forçar ativação
    if (action === 'force') {
      const newPassword = password || 'admin123456'
      const hashedPassword = await hash(newPassword, 12)
      
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
      if (!user.admin) {
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
      }

      return NextResponse.json({
        success: true,
        message: '✅ Usuário forçado como ADMIN ativo',
        email,
        password: newPassword,
        isActive: true,
        role: 'ADMIN'
      })
    }

    // Apenas retornar info
    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasAdmin: !!user.admin,
      adminId: user.admin?.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
