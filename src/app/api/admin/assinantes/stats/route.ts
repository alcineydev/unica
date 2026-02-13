import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if (!['DEVELOPER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Contagens por status
    const statusCounts = await prisma.assinante.groupBy({
      by: ['subscriptionStatus'],
      _count: true,
    })

    const statusMap: Record<string, number> = {}
    let totalAssinantes = 0
    statusCounts.forEach((s) => {
      statusMap[s.subscriptionStatus] = s._count
      totalAssinantes += s._count
    })

    // Contagens por plano
    const planCounts = await prisma.assinante.groupBy({
      by: ['planId'],
      _count: true,
      where: { planId: { not: null } },
    })

    const planIds = planCounts
      .map((p) => p.planId)
      .filter(Boolean) as string[]
    const plans = await prisma.plan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true, price: true },
    })

    const planData = planCounts
      .map((p) => {
        const plan = plans.find((pl) => pl.id === p.planId)
        return {
          planId: p.planId,
          planName: plan?.name || 'Desconhecido',
          price: Number(plan?.price || 0),
          count: p._count,
        }
      })
      .sort((a, b) => b.count - a.count)

    const semPlano =
      totalAssinantes - planCounts.reduce((sum, p) => sum + p._count, 0)

    // Novos assinantes por mês (últimos 6 meses)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const recentAssinantes = await prisma.assinante.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    })

    const monthNames = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ]
    const monthlyNew: Record<string, { month: string; count: number }> = {}

    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyNew[key] = {
        month: `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
        count: 0,
      }
    }

    recentAssinantes.forEach((a) => {
      const d = new Date(a.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (monthlyNew[key]) monthlyNew[key].count++
    })

    // Receita mensal estimada (assinantes ativos × preço do plano)
    const activeWithPlan = await prisma.assinante.findMany({
      where: { subscriptionStatus: 'ACTIVE', planId: { not: null } },
      include: { plan: { select: { price: true } } },
    })

    const receitaMensal = activeWithPlan.reduce(
      (sum, a) => sum + Number(a.plan?.price || 0),
      0
    )

    // Novos últimos 30 dias
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const novosUltimos30 = await prisma.assinante.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    })

    // Cancelados últimos 30 dias
    const canceladosUltimos30 = await prisma.assinante.count({
      where: {
        subscriptionStatus: { in: ['CANCELED', 'EXPIRED'] },
        updatedAt: { gte: thirtyDaysAgo },
      },
    })

    // Taxa de conversão (ativos / total)
    const ativos = statusMap['ACTIVE'] || 0
    const taxaConversao =
      totalAssinantes > 0
        ? ((ativos / totalAssinantes) * 100).toFixed(1)
        : '0'

    return NextResponse.json({
      totals: {
        total: totalAssinantes,
        active: ativos,
        pending: statusMap['PENDING'] || 0,
        inactive:
          (statusMap['INACTIVE'] || 0) + (statusMap['SUSPENDED'] || 0),
        canceled:
          (statusMap['CANCELED'] || 0) + (statusMap['EXPIRED'] || 0),
        guest: statusMap['GUEST'] || 0,
      },
      revenue: {
        monthly: receitaMensal,
        perUser: ativos > 0 ? receitaMensal / ativos : 0,
      },
      trends: {
        newLast30Days: novosUltimos30,
        canceledLast30Days: canceladosUltimos30,
        conversionRate: parseFloat(taxaConversao),
      },
      charts: {
        byStatus: Object.entries(statusMap).map(([status, count]) => ({
          status,
          count,
        })),
        byPlan: planData,
        semPlano,
        monthlyNew: Object.values(monthlyNew),
      },
    })
  } catch (error) {
    console.error('[ASSINANTES STATS]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
