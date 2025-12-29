import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createPlanSchema } from '@/lib/validations/plan'
import { generateSlug } from '@/lib/utils/slug'
import { logger } from '@/lib/logger'

// Forçar rota dinâmica
export const dynamic = 'force-dynamic'

// GET - Listar todos os planos
export async function GET(request: Request) {
  logger.debug('=== GET /api/admin/plans ===')

  try {
    const session = await auth()
    logger.debug('Session:', session?.user?.email)

    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    logger.debug('includeInactive:', includeInactive)

    logger.debug('Executando query...')
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

    logger.debug('Planos encontrados:', plans.length)

    return NextResponse.json({ data: plans })
  } catch (error) {
    console.error('=== ERRO AO LISTAR PLANOS ===')
    console.error('Erro:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
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
    logger.debug('Dados recebidos:', JSON.stringify(body, null, 2))

    const validationResult = createPlanSchema.safeParse(body)
    if (!validationResult.success) {
      logger.debug('Erro de validação:', validationResult.error.flatten())
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { 
      name, 
      description, 
      price, 
      slug,
      priceMonthly,
      priceYearly,
      priceSingle,
      isActive, 
      benefitIds 
    } = validationResult.data

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

    // Gerar slug automaticamente se não foi fornecido ou está vazio
    let finalSlug: string | null = null
    if (slug && slug.trim() !== '') {
      finalSlug = slug.trim()
    } else if (name) {
      finalSlug = generateSlug(name)
    }
    
    // Verificar se slug já existe e adicionar sufixo se necessário
    if (finalSlug) {
      const existingSlug = await prisma.plan.findFirst({
        where: { slug: finalSlug },
      })
      
      if (existingSlug) {
        finalSlug = `${finalSlug}-${Date.now()}`
      }
    }

    // Preparar dados para salvar - tratar valores null/undefined corretamente
    const dataToSave = {
      name,
      description,
      price,
      slug: finalSlug,
      priceMonthly: priceMonthly != null ? priceMonthly : null,
      priceYearly: priceYearly != null ? priceYearly : null,
      priceSingle: priceSingle != null ? priceSingle : null,
      isActive: isActive ?? true,
      planBenefits: {
        create: benefitIds.map((benefitId) => ({
          benefitId,
        })),
      },
    }

    logger.debug('Dados para salvar:', JSON.stringify(dataToSave, null, 2))

    // Cria o plano e associa os benefícios
    const plan = await prisma.plan.create({
      data: dataToSave,
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
    // Retornar mensagem de erro mais detalhada em desenvolvimento
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

