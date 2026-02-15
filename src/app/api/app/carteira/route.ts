import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar assinante
    const assinante = await prisma.assinante.findFirst({
      where: { userId: session.user.id },
      include: {
        plan: {
          select: { id: true, name: true, slug: true },
        },
        user: {
          select: { avatar: true },
        },
      },
    })

    if (!assinante) {
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
    }

    // Buscar cashback por parceiro
    const cashbackBalances = await prisma.cashbackBalance.findMany({
      where: {
        assinanteId: assinante.id,
        balance: { gt: 0 },
      },
      include: {
        parceiro: {
          select: {
            id: true,
            companyName: true,
            tradeName: true,
            logo: true,
            category: true,
          },
        },
      },
      orderBy: { balance: 'desc' },
    })

    // Total cashback (soma dos saldos ativos)
    const totalCashback = cashbackBalances.reduce(
      (sum, cb) => sum + Number(cb.balance), 0
    )

    // Últimas transações
    const transactions = await prisma.transaction.findMany({
      where: { assinanteId: assinante.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        parceiro: {
          select: {
            id: true,
            companyName: true,
            tradeName: true,
            logo: true,
          },
        },
      },
    })

    return NextResponse.json({
      data: {
        assinante: {
          name: assinante.name,
          cpf: assinante.cpf,
          qrCode: assinante.qrCode,
          points: Number(assinante.points),
          cashback: Number(totalCashback.toFixed(2)),
          avatar: assinante.user?.avatar || null,
          subscriptionStatus: assinante.subscriptionStatus,
          plan: assinante.plan,
        },
        cashbackByPartner: cashbackBalances.map(cb => ({
          parceiroId: cb.parceiro.id,
          parceiroName: cb.parceiro.tradeName || cb.parceiro.companyName,
          parceiroLogo: cb.parceiro.logo,
          parceiroCategory: cb.parceiro.category,
          balance: Number(cb.balance),
          totalEarned: Number(cb.totalEarned),
          totalUsed: Number(cb.totalUsed),
        })),
        totalCashback: Number(totalCashback.toFixed(2)),
        transactions: transactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          pointsUsed: Number(t.pointsUsed),
          cashbackGenerated: Number(t.cashbackGenerated),
          cashbackUsed: Number(t.cashbackUsed),
          discountApplied: Number(t.discountApplied),
          description: t.description,
          status: t.status,
          createdAt: t.createdAt,
          parceiro: t.parceiro ? {
            id: t.parceiro.id,
            name: t.parceiro.tradeName || t.parceiro.companyName,
            logo: t.parceiro.logo,
          } : null,
        })),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar carteira:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
