import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar assinante com plano atual
    const assinante = await prisma.assinante.findUnique({
      where: { userId: session.user.id },
      select: {
        planId: true,
        subscriptionStatus: true,
        planStartDate: true,
        planEndDate: true,
      },
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
                description: true,
              },
            },
          },
        },
      },
      orderBy: { price: 'asc' },
    })

    // Formatar planos
    const formattedPlans = plans.map((plan) => {
      const benefitValue = (val: unknown): number => {
        if (typeof val === 'number') return val
        if (typeof val === 'object' && val !== null) {
          const obj = val as Record<string, unknown>
          return Number(
            obj.percentage || obj.value || obj.multiplier || obj.monthlyPoints || 0
          )
        }
        return 0
      }

      return {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        price: Number(plan.price),
        priceMonthly: plan.priceMonthly ? Number(plan.priceMonthly) : null,
        priceYearly: plan.priceYearly ? Number(plan.priceYearly) : null,
        period: plan.period || 'MONTHLY',
        features: plan.features || [],
        benefits: plan.planBenefits.map((pb) => ({
          id: pb.benefit.id,
          name: pb.benefit.name,
          type: pb.benefit.type,
          value: benefitValue(pb.benefit.value),
          description: pb.benefit.description,
        })),
      }
    })

    // Plano atual (completo)
    const isActive = assinante?.subscriptionStatus === 'ACTIVE'
    const currentPlan = isActive && assinante?.planId
      ? formattedPlans.find((p) => p.id === assinante.planId) || null
      : null

    return NextResponse.json({
      plans: formattedPlans,
      currentPlan,
      currentPlanId: currentPlan?.id || null,
      subscription: assinante
        ? {
            status: assinante.subscriptionStatus,
            startDate: assinante.planStartDate,
            endDate: assinante.planEndDate,
          }
        : null,
    })
  } catch (error) {
    console.error('[APP PLANOS]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
