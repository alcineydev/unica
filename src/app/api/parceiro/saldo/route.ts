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

    return NextResponse.json({
      data: {
        totalSales: completed._count || 0,
        salesAmount: Number(completed._sum.amount || 0),
        pendingAmount: Number(pending._sum.amount || 0),
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

