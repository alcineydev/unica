import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('[API PLANS] Buscando planos...')
    
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      include: {
        planBenefits: {
          include: {
            benefit: true
          }
        }
      }
    })

    console.log('[API PLANS] Planos encontrados:', plans.length)

    // Formatar os planos para o frontend
    const formattedPlans = plans.map((plan, index) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      price: Number(plan.price),
      yearlyPrice: plan.priceYearly ? Number(plan.priceYearly) : null,
      lifetimePrice: plan.priceSingle ? Number(plan.priceSingle) : null,
      features: plan.features.length > 0 
        ? plan.features 
        : plan.planBenefits.map(pb => pb.benefit.name),
      isPopular: index === 1,
      isActive: plan.isActive
    }))

    return NextResponse.json({ plans: formattedPlans })

  } catch (error) {
    console.error('[API PLANS] Erro ao buscar planos:', error)
    return NextResponse.json({ 
      plans: [],
      error: 'Erro ao buscar planos' 
    }, { status: 500 })
  }
}
