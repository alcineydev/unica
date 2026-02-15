import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session || !['PARCEIRO', 'DEVELOPER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      assinanteId,
      amount,
      discountApplied = 0,
      pointsUsed = 0,
      cashbackGenerated = 0,
      cashbackUsed = 0,
      finalAmount = 0,
      description = '',
    } = body

    if (!assinanteId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Buscar parceiro logado
    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id },
      select: { id: true, companyName: true, tradeName: true },
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    const parceiroName = parceiro.tradeName || parceiro.companyName

    // Validar cashback disponível (segurança server-side)
    if (cashbackUsed > 0) {
      const cashbackBalance = await prisma.cashbackBalance.findUnique({
        where: {
          assinanteId_parceiroId: {
            assinanteId,
            parceiroId: parceiro.id,
          },
        },
      })

      const available = Number(cashbackBalance?.balance || 0)
      if (cashbackUsed > available) {
        return NextResponse.json(
          { error: `Saldo de cashback insuficiente. Disponível: R$ ${available.toFixed(2)}` },
          { status: 400 }
        )
      }
    }

    // Validar pontos disponíveis
    if (pointsUsed > 0) {
      const assinante = await prisma.assinante.findUnique({
        where: { id: assinanteId },
        select: { points: true },
      })
      if (pointsUsed > Number(assinante?.points || 0)) {
        return NextResponse.json({ error: 'Pontos insuficientes' }, { status: 400 })
      }
    }

    // Transação atômica
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar Transaction
      const transaction = await tx.transaction.create({
        data: {
          type: 'PURCHASE',
          assinanteId,
          parceiroId: parceiro.id,
          amount,
          discountApplied,
          pointsUsed,
          cashbackGenerated,
          cashbackUsed,
          description: description || `Compra em ${parceiroName}`,
          status: 'COMPLETED',
          metadata: {
            finalAmount,
            originalAmount: amount,
          },
        },
      })

      // 2. Atualizar pontos do assinante (se usou)
      if (pointsUsed > 0) {
        await tx.assinante.update({
          where: { id: assinanteId },
          data: {
            points: { decrement: pointsUsed },
          },
        })
      }

      // 3. Atualizar CashbackBalance (cashback usado + cashback gerado)
      if (cashbackGenerated > 0 || cashbackUsed > 0) {
        const netCashback = Number((cashbackGenerated - cashbackUsed).toFixed(2))

        await tx.cashbackBalance.upsert({
          where: {
            assinanteId_parceiroId: {
              assinanteId,
              parceiroId: parceiro.id,
            },
          },
          update: {
            balance: netCashback >= 0
              ? { increment: netCashback }
              : { decrement: Math.abs(netCashback) },
            ...(cashbackGenerated > 0 && { totalEarned: { increment: cashbackGenerated } }),
            ...(cashbackUsed > 0 && { totalUsed: { increment: cashbackUsed } }),
          },
          create: {
            assinanteId,
            parceiroId: parceiro.id,
            balance: cashbackGenerated,
            totalEarned: cashbackGenerated,
            totalUsed: 0,
          },
        })
      }

      // 4. Atualizar campo global cashback do assinante (cache = soma dos saldos)
      const allBalances = await tx.cashbackBalance.aggregate({
        where: { assinanteId },
        _sum: { balance: true },
      })

      await tx.assinante.update({
        where: { id: assinanteId },
        data: {
          cashback: Number(allBalances._sum.balance || 0),
        },
      })

      // 5. Atualizar métricas do parceiro
      const currentParceiro = await tx.parceiro.findUnique({
        where: { id: parceiro.id },
        select: { metrics: true },
      })

      const metrics = (currentParceiro?.metrics as Record<string, number>) || {}
      await tx.parceiro.update({
        where: { id: parceiro.id },
        data: {
          metrics: {
            ...metrics,
            totalSales: (metrics.totalSales || 0) + 1,
            salesAmount: Number(((metrics.salesAmount || 0) + amount).toFixed(2)),
            cashbackIssued: Number(((metrics.cashbackIssued || 0) + cashbackGenerated).toFixed(2)),
            cashbackRedeemed: Number(((metrics.cashbackRedeemed || 0) + cashbackUsed).toFixed(2)),
          },
        },
      })

      // 6. Criar notificação para avaliar
      try {
        await tx.assinanteNotificacao.create({
          data: {
            assinanteId,
            tipo: 'AVALIACAO',
            titulo: 'Avalie sua experiência',
            mensagem: `Como foi sua compra em ${parceiroName}? Avalie e ganhe +1 ponto!`,
            dados: {
              parceiroId: parceiro.id,
              transactionId: transaction.id,
              link: `/app/avaliar/${parceiro.id}`,
            },
            lida: false,
          },
        })
      } catch (e) {
        logger.debug('Erro ao criar notificação de avaliação:', e)
      }

      return transaction
    })

    return NextResponse.json({
      message: 'Venda registrada com sucesso',
      data: {
        transactionId: result.id,
        amount,
        finalAmount,
        discountApplied,
        pointsUsed,
        cashbackUsed,
        cashbackGenerated,
      },
    })
  } catch (error) {
    console.error('Erro ao confirmar venda:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
