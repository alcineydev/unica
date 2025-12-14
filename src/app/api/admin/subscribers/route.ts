import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth, hashPassword } from '@/lib/auth'
import { createSubscriberSchema } from '@/lib/validations/subscriber'

// GET - Listar todos os assinantes
export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get('cityId')
    const planId = searchParams.get('planId')
    const status = searchParams.get('status')

    const subscribers = await prisma.assinante.findMany({
      where: {
        ...(cityId ? { cityId } : {}),
        ...(planId ? { planId } : {}),
        ...(status ? { subscriptionStatus: status as 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED' } : {}),
      },
      orderBy: { name: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            avatar: true,
          },
        },
        city: {
          select: {
            id: true,
            name: true,
            state: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    })

    return NextResponse.json({ data: subscribers })
  } catch (error) {
    console.error('Erro ao listar assinantes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo assinante
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const validationResult = createSubscriberSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('Erro de validação:', validationResult.error.flatten().fieldErrors)
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { 
      email, password, name, cpf, phone,
      cityId, planId, subscriptionStatus 
    } = validationResult.data

    // Verifica se email já existe
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    })
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 409 }
      )
    }

    // Verifica se CPF já existe (apenas se foi fornecido)
    if (cpf) {
      const existingCPF = await prisma.assinante.findUnique({
        where: { cpf },
      })
      if (existingCPF) {
        return NextResponse.json(
          { error: 'Este CPF já está cadastrado' },
          { status: 409 }
        )
      }
    }

    // Verifica se cidade existe (apenas se foi selecionada)
    if (cityId) {
      const city = await prisma.city.findUnique({
        where: { id: cityId },
      })
      if (!city) {
        return NextResponse.json(
          { error: 'Cidade não encontrada' },
          { status: 400 }
        )
      }
    }

    // Verifica se plano existe (apenas se foi selecionado)
    if (planId) {
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
      })
      if (!plan) {
        return NextResponse.json(
          { error: 'Plano não encontrado' },
          { status: 400 }
        )
      }
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password)

    // Gera QR Code baseado no CPF ou ID único
    const qrCode = cpf ? `UNICA-${cpf}` : `UNICA-${Date.now()}`

    // Cria o usuário e o assinante
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ASSINANTE',
        isActive: true,
        assinante: {
          create: {
            name,
            cpf: cpf || null,
            phone: phone || null,
            qrCode,
            cityId: cityId || null,
            planId: planId || null,
            subscriptionStatus: subscriptionStatus || 'PENDING',
            points: 0,
            cashback: 0,
          },
        },
      },
      include: {
        assinante: {
          include: {
            city: true,
            plan: true,
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Assinante criado com sucesso', data: user.assinante },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar assinante:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

