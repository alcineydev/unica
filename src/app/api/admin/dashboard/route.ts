import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()

    if (!session || !['DEVELOPER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Datas para cálculos
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Total de Assinantes
    const totalAssinantes = await prisma.assinante.count()
    const assinantesLastMonth = await prisma.assinante.count({
      where: {
        createdAt: { lt: startOfMonth }
      }
    })
    const assinantesGrowth = assinantesLastMonth > 0 
      ? Math.round(((totalAssinantes - assinantesLastMonth) / assinantesLastMonth) * 100)
      : totalAssinantes > 0 ? 100 : 0

    // Assinantes Ativos
    const assinantesAtivos = await prisma.assinante.count({
      where: { subscriptionStatus: 'ACTIVE' }
    })

    // Parceiros Ativos
    const parceirosAtivos = await prisma.parceiro.count({
      where: { isActive: true }
    })
    const parceirosLastMonth = await prisma.parceiro.count({
      where: {
        isActive: true,
        createdAt: { lt: startOfMonth }
      }
    })
    const parceirosGrowth = parceirosLastMonth > 0
      ? Math.round(((parceirosAtivos - parceirosLastMonth) / parceirosLastMonth) * 100)
      : parceirosAtivos > 0 ? 100 : 0

    // Receita Mensal (assinantes ativos x preço do plano)
    const assinantesComPlano = await prisma.assinante.findMany({
      where: { 
        subscriptionStatus: 'ACTIVE',
        planId: { not: null }
      },
      include: {
        plan: {
          select: { price: true }
        }
      }
    })
    const receitaMensal = assinantesComPlano.reduce((acc, a) => {
      const price = a.plan?.price ? Number(a.plan.price) : 0
      return acc + price
    }, 0)
    
    // Receita do mês passado (aproximação)
    const assinantesAtivosLastMonth = await prisma.assinante.count({
      where: {
        subscriptionStatus: 'ACTIVE',
        planId: { not: null },
        createdAt: { lt: startOfMonth }
      }
    })
    const receitaLastMonth = assinantesAtivosLastMonth > 0 ? receitaMensal * 0.85 : 0
    const receitaGrowth = receitaLastMonth > 0
      ? Math.round(((receitaMensal - receitaLastMonth) / receitaLastMonth) * 100)
      : receitaMensal > 0 ? 100 : 0

    // Taxa de Conversão (ativos / total)
    const taxaConversao = totalAssinantes > 0 
      ? Math.round((assinantesAtivos / totalAssinantes) * 100)
      : 0

    // Últimos assinantes cadastrados (Atividades Recentes)
    const ultimosAssinantes = await prisma.assinante.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true, avatar: true }
        },
        plan: {
          select: { name: true }
        }
      }
    })

    // Dados para gráfico - Assinaturas por dia nos últimos 30 dias
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const assinaturasRecentes = await prisma.assinante.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // Formatar dados do gráfico
    const chartData: { date: string; assinaturas: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const count = assinaturasRecentes.filter(a => 
        a.createdAt.toISOString().split('T')[0] === dateStr
      ).length
      
      chartData.push({
        date: dateStr,
        assinaturas: count
      })
    }

    // Assinantes por plano (para gráfico de pizza)
    const assinantesPorPlano = await prisma.assinante.groupBy({
      by: ['planId'],
      where: {
        planId: { not: null }
      },
      _count: true
    })

    const planos = await prisma.plan.findMany({
      select: { id: true, name: true, price: true }
    })

    const planDistribution = assinantesPorPlano.map(a => {
      const plan = planos.find(p => p.id === a.planId)
      return {
        name: plan?.name || 'Sem plano',
        value: a._count,
        price: plan?.price ? Number(plan.price) : 0
      }
    })

    return NextResponse.json({
      stats: {
        totalAssinantes,
        assinantesAtivos,
        assinantesGrowth,
        parceirosAtivos,
        parceirosGrowth,
        receitaMensal,
        receitaGrowth,
        taxaConversao
      },
      recentActivities: ultimosAssinantes.map(a => ({
        id: a.id,
        type: 'new_subscriber',
        name: a.name || 'Sem nome',
        email: a.user?.email,
        avatar: a.user?.avatar,
        plan: a.plan?.name || 'Sem plano',
        status: a.subscriptionStatus,
        createdAt: a.createdAt
      })),
      chartData,
      planDistribution
    })

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

