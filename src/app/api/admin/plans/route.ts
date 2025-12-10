import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createPlanSchema } from '@/lib/validations/plan'

// GET - Listar todos os planos
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
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const plans = await prisma.plan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { price: 'asc' },
      include: {
        planBenefits: {
          include: {
            benefit: {
              select: {
                id: true,
                name: true,
                type: true,
                value: true,
              },
            },
          },
        },
        _count: {
          select: {
            assinantes: true,
          },
        },
      },
    })

    return NextResponse.json({ data: plans })
  } catch (error) {
    console.error('Erro ao listar planos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo plano
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

    const validationResult = createPlanSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, description, price, isActive, benefitIds } = validationResult.data

    // Verifica se os benefícios existem
    const benefits = await prisma.benefit.findMany({
      where: { id: { in: benefitIds } },
    })

    if (benefits.length !== benefitIds.length) {
      return NextResponse.json(
        { error: 'Um ou mais benefícios selecionados não existem' },
        { status: 400 }
      )
    }

    // Cria o plano e associa os benefícios
    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        price,
        isActive,
        planBenefits: {
          create: benefitIds.map((benefitId) => ({
            benefitId,
          })),
        },
      },
      include: {
        planBenefits: {
          include: {
            benefit: true,
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Plano criado com sucesso', data: plan },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar plano:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

