import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createBenefitSchema, validateBenefitConfig } from '@/lib/validations/benefit'

// GET - Listar todos os benefícios
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
    const type = searchParams.get('type')

    const benefits = await prisma.benefit.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(type ? { type: type as 'DESCONTO' | 'CASHBACK' | 'PONTOS' | 'ACESSO_EXCLUSIVO' } : {}),
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            planBenefits: true,
            benefitAccess: true,
          },
        },
      },
    })

    return NextResponse.json({ data: benefits })
  } catch (error) {
    console.error('Erro ao listar benefícios:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo benefício
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

    const validationResult = createBenefitSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, description, type, value, isActive } = validationResult.data

    // Valida a configuração específica do tipo
    const configValidation = validateBenefitConfig(type, value as Record<string, unknown>)
    if (!configValidation.success) {
      return NextResponse.json(
        { error: configValidation.error },
        { status: 400 }
      )
    }

    const benefit = await prisma.benefit.create({
      data: {
        name,
        description,
        type,
        value: value as object,
        category: null,
        isActive,
      },
    })

    return NextResponse.json(
      { message: 'Benefício criado com sucesso', data: benefit },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar benefício:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

