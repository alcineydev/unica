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

    // Busca o parceiro
    const parceiro = await prisma.parceiro.findUnique({
      where: { userId: session.user.id! },
    })

    if (!parceiro) {
      return NextResponse.json(
        { error: 'Parceiro nao encontrado' },
        { status: 404 }
      )
    }

    // Busca todas as transacoes
    const transactions = await prisma.transaction.findMany({
      where: { parceiroId: parceiro.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        assinante: {
          select: {
            name: true,
          },
        },
      },
    })

    // Calcula totais
    const completed = await prisma.transaction.aggregate({
      where: {
        parceiroId: parceiro.id,
        status: 'COMPLETED',
      },
      _count: true,
      _sum: {
        amount: true,
      },
    })

    const pending = await prisma.transaction.aggregate({
      where: {
        parceiroId: parceiro.id,
        status: 'PENDING',
      },
      _sum: {
        amount: true,
      },
    })

    // Cashback dos clientes
    const cashbackBalances = await prisma.cashbackBalance.findMany({
      where: {
        parceiroId: parceiro.id,
        balance: { gt: 0 },
      },
      include: {
        assinante: {
          select: {
            id: true,
            name: true,
            cpf: true,
            user: { select: { avatar: true } },
          },
        },
      },
      orderBy: { balance: 'desc' },
    })

    const cashbackTotals = {
      totalPending: cashbackBalances.reduce((sum, b) => sum + Number(b.balance), 0),
      totalIssued: cashbackBalances.reduce((sum, b) => sum + Number(b.totalEarned), 0),
      totalRedeemed: cashbackBalances.reduce((sum, b) => sum + Number(b.totalUsed), 0),
    }

    return NextResponse.json({
      data: {
        totalSales: completed._count || 0,
        salesAmount: Number(completed._sum.amount || 0),
        pendingAmount: Number(pending._sum.amount || 0),
        cashbackTotals,
        cashbackBalances: cashbackBalances.map(b => ({
          assinanteId: b.assinante.id,
          name: b.assinante.name,
          cpf: b.assinante.cpf,
          avatar: b.assinante.user?.avatar || null,
          balance: Number(b.balance),
          totalEarned: Number(b.totalEarned),
          totalUsed: Number(b.totalUsed),
          updatedAt: b.updatedAt.toISOString(),
        })),
        transactions: transactions.map(tx => ({
          id: tx.id,
          amount: Number(tx.amount),
          type: tx.type,
          status: tx.status,
          createdAt: tx.createdAt.toISOString(),
          assinante: tx.assinante,
        })),
      },
    })
  } catch (error) {
    console.error('Erro ao carregar saldo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

