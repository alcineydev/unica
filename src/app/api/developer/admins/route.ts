import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const runtime = 'nodejs'

const createAdminSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  phone: z.string().min(10, 'Telefone inválido'),
})

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
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(admins)
  } catch (error) {
    console.error('Erro ao listar admins:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo admin
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createAdminSchema.parse(body)

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Criar usuário e admin em uma transação
    const result = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        admin: {
          create: {
            name: validatedData.name,
            phone: validatedData.phone,
            permissions: {
              cities: true,
              benefits: true,
              plans: true,
              partners: true,
              subscribers: true,
              integrations: true,
              reports: true,
            },
          },
        },
      },
      include: {
        admin: true,
      },
    })

    // Registrar log
    await prisma.systemLog.create({
      data: {
        action: 'CREATE_ADMIN',
        entity: 'Admin',
        entityId: result.admin?.id || '',
        details: { email: validatedData.email, name: validatedData.name },
        userId: session.user.id,
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erro ao criar admin:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

