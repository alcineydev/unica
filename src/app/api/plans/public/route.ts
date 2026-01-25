import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      include: {
        planBenefits: {
          include: {
            benefit: true
          }
        }
      },
      orderBy: { price: 'asc' }
    })

    return NextResponse.json({
      success: true,
      plans: plans.map(plan => ({
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
      }))
    })

  } catch (error) {
    console.error('[PLANS] Erro ao listar planos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar planos' },
      { status: 500 }
    )
  }
}

