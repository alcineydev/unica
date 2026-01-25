import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ planId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { planId } = await params

    const plan = await prisma.plan.findFirst({
      where: { 
        OR: [
          { id: planId },
          { slug: planId }
        ],
        isActive: true 
      },
      include: {
        planBenefits: {
          include: {
            benefit: true
          }
        }
      }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      plan: {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        price: Number(plan.price),
        priceMonthly: plan.priceMonthly ? Number(plan.priceMonthly) : null,
        priceYearly: plan.priceYearly ? Number(plan.priceYearly) : null,
        priceSingle: plan.priceSingle ? Number(plan.priceSingle) : null,
        period: plan.period,
        features: plan.features,
        benefits: plan.planBenefits.map(pb => ({
          id: pb.benefit.id,
          name: pb.benefit.name,
          description: pb.benefit.description,
          type: pb.benefit.type
        }))
      }
    })

  } catch (error) {
    console.error('[PLAN] Erro ao buscar plano:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar plano' },
      { status: 500 }
    )
  }
}

