import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar plano atual do assinante
    const assinante = await prisma.assinante.findUnique({
      where: { userId: session.user.id },
      select: { planId: true, subscriptionStatus: true }
    })

    // Buscar planos ativos com benefícios
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      include: {
        planBenefits: {
          include: {
            benefit: {
              select: {
                id: true,
                name: true,
                type: true,
                value: true,
                description: true
              }
            }
          }
        }
      },
      orderBy: { price: 'asc' }
    })

    // Formatar resposta
    const formattedPlans = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      price: Number(plan.priceMonthly || plan.price),
      period: plan.period || 'MONTHLY',
      features: plan.features || [],
      benefits: plan.planBenefits.map(pb => ({
        id: pb.benefit.id,
        name: pb.benefit.name,
        type: pb.benefit.type,
        value: Number(pb.benefit.value),
        description: pb.benefit.description
      }))
    }))

    // Verificar se o plano atual está ativo
    const currentPlanId = assinante?.subscriptionStatus === 'ACTIVE' 
      ? assinante.planId 
      : null

    return NextResponse.json({ 
      plans: formattedPlans,
      currentPlanId
    })

  } catch (error) {
    console.error('Erro ao buscar planos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

