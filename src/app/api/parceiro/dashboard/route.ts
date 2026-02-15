import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { Decimal } from '@prisma/client/runtime/library'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Busca o parceiro do usuario logado
    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id }
    })

    if (!parceiro) {
      return NextResponse.json(
        { error: 'Parceiro não encontrado' },
        { status: 404 }
      )
    }

    // Busca as metricas do parceiro
    const metrics = (parceiro.metrics || {}) as {
      pageViews?: number
      whatsappClicks?: number
      totalSales?: number
      salesAmount?: number
    }

    // Busca as transacoes recentes (ultimos 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    type TransactionWithAssinante = {
      id: string
      amount: Decimal
      createdAt: Date
      assinante: { name: string | null } | null
    }
    let recentTransactions: TransactionWithAssinante[] = []
    try {
      recentTransactions = await prisma.transaction.findMany({
        where: {
          parceiroId: parceiro.id,
          createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          assinante: {
            select: {
              name: true,
            },
          },
        },
      })
    } catch (e) {
      console.error('[DASHBOARD] Erro ao buscar transações:', e)
    }

    // Calcula totais do mes atual
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    let vendasMes = 0
    let faturamentoMes = 0
    try {
      const monthlyStats = await prisma.transaction.aggregate({
        where: {
          parceiroId: parceiro.id,
          createdAt: { gte: firstDayOfMonth },
          status: 'COMPLETED',
        },
        _count: true,
        _sum: {
          amount: true,
        },
      })
      vendasMes = monthlyStats._count || 0
      faturamentoMes = monthlyStats._sum.amount
        ? parseFloat(monthlyStats._sum.amount.toString())
        : 0
    } catch (e) {
      console.error('[DASHBOARD] Erro ao agregar transações:', e)
    }

    // Buscar estatísticas de avaliações
    let avaliacoes: { nota: number }[] = []
    try {
      avaliacoes = await prisma.avaliacao.findMany({
        where: { parceiroId: parceiro.id },
        select: { nota: true }
      })
    } catch (e) {
      console.error('[DASHBOARD] Erro ao buscar avaliações:', e)
    }

    const mediaAvaliacoes = avaliacoes.length > 0
      ? avaliacoes.reduce((sum, a) => sum + a.nota, 0) / avaliacoes.length
      : 0

    // Cashback metrics
    let cashbackMetrics = {
      totalIssued: 0,
      totalRedeemed: 0,
      totalPending: 0,
      clientsWithBalance: 0,
    }
    try {
      const cashbackData = await prisma.cashbackBalance.aggregate({
        where: { parceiroId: parceiro.id },
        _sum: {
          totalEarned: true,
          totalUsed: true,
          balance: true,
        },
        _count: true,
      })

      const clientsWithBalance = await prisma.cashbackBalance.count({
        where: {
          parceiroId: parceiro.id,
          balance: { gt: 0 },
        },
      })

      cashbackMetrics = {
        totalIssued: Number(cashbackData._sum.totalEarned || 0),
        totalRedeemed: Number(cashbackData._sum.totalUsed || 0),
        totalPending: Number(cashbackData._sum.balance || 0),
        clientsWithBalance,
      }
    } catch (e) {
      console.error('[DASHBOARD] Erro ao buscar cashback:', e)
    }

    return NextResponse.json({
      data: {
        totalSales: vendasMes,
        salesAmount: faturamentoMes,
        pageViews: metrics.pageViews || 0,
        whatsappClicks: metrics.whatsappClicks || 0,
        avaliacoes: {
          total: avaliacoes.length,
          media: Math.round(mediaAvaliacoes * 10) / 10
        },
        cashback: cashbackMetrics,
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.id,
          amount: parseFloat(tx.amount?.toString() || '0'),
          createdAt: tx.createdAt.toISOString(),
          assinante: tx.assinante,
        })),
      },
    })
  } catch (error) {
    console.error('[DASHBOARD] Erro geral:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
