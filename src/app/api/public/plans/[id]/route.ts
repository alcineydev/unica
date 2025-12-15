import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const plan = await prisma.plan.findUnique({
      where: { id },
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

