import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Buscar plano por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const plan = await prisma.plan.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        price: true,
        priceMonthly: true,
        priceSingle: true,
        priceYearly: true,
        period: true,
        description: true,
        features: true,
        isActive: true,
        planBenefits: {
          include: {
            benefit: true,
          },
        },
      },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    if (!plan.isActive) {
      return NextResponse.json({ error: 'Plano não disponível' }, { status: 404 })
    }

    return NextResponse.json({
      id: plan.id,
      name: plan.name,
      price: Number(plan.price),
      priceMonthly: plan.priceMonthly ? Number(plan.priceMonthly) : null,
      priceSingle: plan.priceSingle ? Number(plan.priceSingle) : null,
      priceYearly: plan.priceYearly ? Number(plan.priceYearly) : null,
      period: plan.period,
      description: plan.description,
      features: plan.features,
      benefits: plan.planBenefits.map((pb: { benefit: { id: string; name: string; description: string | null } }) => ({
        id: pb.benefit.id,
        name: pb.benefit.name,
        description: pb.benefit.description,
      })),
    })
  } catch (error) {
    console.error('Erro ao buscar plano:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
