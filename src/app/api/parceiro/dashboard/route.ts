import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'PARCEIRO') {
      return NextResponse.json(
        { error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    // Busca o parceiro do usuario logado
    const parceiro = await prisma.parceiro.findUnique({
      where: { userId: session.user.id! },
    })

    if (!parceiro) {
      return NextResponse.json(
        { error: 'Parceiro nao encontrado' },
        { status: 404 }
      )
    }

    // Busca as metricas
    const metrics = parceiro.metrics as {
      pageViews?: number
      whatsappClicks?: number
      totalSales?: number
      salesAmount?: number
    }

    // Busca as transacoes recentes (ultimos 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentTransactions = await prisma.transaction.findMany({
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

    // Calcula totais do mes atual
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

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

    return NextResponse.json({
      data: {
        totalSales: monthlyStats._count || 0,
        salesAmount: Number(monthlyStats._sum.amount || 0),
        pageViews: metrics.pageViews || 0,
        whatsappClicks: metrics.whatsappClicks || 0,
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.id,
          amount: Number(tx.amount),
          createdAt: tx.createdAt.toISOString(),
          assinante: tx.assinante,
        })),
      },
    })
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

