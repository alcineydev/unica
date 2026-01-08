import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Buscar por slug ou ID
    const plan = await prisma.plan.findFirst({
      where: {
        OR: [
          { slug: id },
          { id: id },
        ],
        isActive: true,
      },
      include: {
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

    return NextResponse.json({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      price: Number(plan.price),
      priceMonthly: plan.priceMonthly ? Number(plan.priceMonthly) : null,
      priceSingle: plan.priceSingle ? Number(plan.priceSingle) : null,
      priceYearly: plan.priceYearly ? Number(plan.priceYearly) : null,
      period: plan.period,
      features: plan.features,
      benefits: plan.planBenefits.map((pb: { benefit: { id: string; name: string; description: string | null; type: string } }) => ({
        id: pb.benefit.id,
        name: pb.benefit.name,
        description: pb.benefit.description,
        type: pb.benefit.type,
      })),
    })
  } catch (error) {
    console.error('Erro ao buscar plano:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
