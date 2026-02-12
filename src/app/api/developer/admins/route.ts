import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { EmailService } from '@/lib/email-service'

// GET - Listar todos os admins
export async function GET() {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const admins = await prisma.admin.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transformar para o formato esperado pela página
    const transformedAdmins = admins.map(admin => ({
      id: admin.user.id,           // ID do User (usado nas ações)
      email: admin.user.email,
      phone: admin.user.phone || admin.phone,
      isActive: admin.user.isActive,
      createdAt: admin.user.createdAt,
      updatedAt: admin.user.updatedAt,
      name: admin.name,
      adminId: admin.id,           // ID do Admin
    }))

    return NextResponse.json(transformedAdmins)
  } catch (error) {
    console.error('Erro ao listar admins:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar novo admin
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, password } = body

    // Validações
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 })
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Este email já está em uso' }, { status: 400 })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar User + Admin em transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar User
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          phone,
          role: 'ADMIN',
          isActive: true,
        },
      })

      // Criar Admin
      const admin = await tx.admin.create({
        data: {
          userId: user.id,
          name,
          phone,
        },
      })

      return { user, admin }
    })

    // Enviar email de boas-vindas
    await EmailService.sendWelcomeAdmin(email, name, password)

    // Log
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        action: 'CREATE_ADMIN',
        userId: result.user.id,
        details: { name, email, performedBy: session.user.id },
      },
    })

    // Retornar no formato esperado
    return NextResponse.json({
      id: result.user.id,
      email: result.user.email,
      phone: result.user.phone,
      isActive: result.user.isActive,
      createdAt: result.user.createdAt,
      updatedAt: result.user.updatedAt,
      name: result.admin.name,
      adminId: result.admin.id,
    })
  } catch (error) {
    console.error('Erro ao criar admin:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
