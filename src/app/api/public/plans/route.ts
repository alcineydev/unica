import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { 
        isActive: true 
      },
      orderBy: { 
        price: 'asc' 
      },
      include: {
        planBenefits: {
          include: {
            benefit: true
          }
        }
      }
    })

    // Formatar os planos para o frontend
    const formattedPlans = plans.map((plan, index) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      price: Number(plan.price),
      yearlyPrice: plan.priceYearly ? Number(plan.priceYearly) : undefined,
      features: plan.planBenefits.map(pb => pb.benefit.name),
      isPopular: index === 1 // Segundo plano é o mais popular por padrão
    }))

    return NextResponse.json({ plans: formattedPlans })

  } catch (error) {
    console.error('Erro ao buscar planos:', error)
    return NextResponse.json({ plans: [] })
  }
}
