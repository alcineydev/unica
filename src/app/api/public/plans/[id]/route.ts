import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Tenta buscar por ID primeiro, depois por slug
    let plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        planBenefits: {
          include: {
            benefit: true
          }
        }
      }
    })

    // Se não encontrou por ID, tenta por slug
    if (!plan) {
      plan = await prisma.plan.findFirst({
        where: {
          slug: id,
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
    }

    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    // Retorna dados completos do plano para o checkout
    return NextResponse.json({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price: Number(plan.price),
      priceMonthly: plan.priceMonthly ? Number(plan.priceMonthly) : Number(plan.price),
      priceYearly: plan.priceYearly ? Number(plan.priceYearly) : undefined,
      priceSingle: plan.priceSingle ? Number(plan.priceSingle) : undefined,
      isActive: plan.isActive,
      features: plan.planBenefits.map(pb => pb.benefit.name),
      benefits: plan.planBenefits.map(pb => ({
        id: pb.benefit.id,
        name: pb.benefit.name,
        description: pb.benefit.description,
        type: pb.benefit.type,
      })),
      // Formato legado para compatibilidade
      plan: {
        id: plan.id,
        name: plan.name,
        description: plan.description || '',
        price: Number(plan.price),
        yearlyPrice: plan.priceYearly ? Number(plan.priceYearly) : undefined,
        features: plan.planBenefits.map(pb => pb.benefit.name)
      }
    })

  } catch (error) {
    console.error('Erro ao buscar plano:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
