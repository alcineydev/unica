import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const confirmarSchema = z.object({
  assinanteId: z.string(),
  amount: z.number().min(1),
  pointsUsed: z.number().min(0),
  discount: z.number().min(0),
  cashbackGenerated: z.number().min(0),
})

export async function POST(request: Request) {
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
      where: { userId: session.user.id },
    })

    if (!parceiro) {
      return NextResponse.json(
        { error: 'Parceiro nao encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = confirmarSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { assinanteId, amount, pointsUsed, discount, cashbackGenerated } = validation.data

    // Busca o assinante
    const assinante = await prisma.assinante.findUnique({
      where: { id: assinanteId },
    })

    if (!assinante) {
      return NextResponse.json(
        { error: 'Assinante nao encontrado' },
        { status: 404 }
      )
    }

    if (assinante.subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Assinatura inativa' },
        { status: 400 }
      )
    }

    // Valida se o assinante tem pontos suficientes
    const assinantePoints = Number(assinante.points)
    if (pointsUsed > assinantePoints) {
      return NextResponse.json(
        { error: 'Pontos insuficientes' },
        { status: 400 }
      )
    }

    // Calcula valor final
    const finalAmount = amount - discount - pointsUsed

    // Cria a transacao e atualiza saldos em uma transaction
    const transaction = await prisma.$transaction(async (tx) => {
      // Cria a transacao
      const newTransaction = await tx.transaction.create({
        data: {
          assinanteId,
          parceiroId: parceiro.id,
          amount,
          pointsUsed,
          cashbackGenerated,
          discountApplied: discount,
          type: 'PURCHASE',
          status: 'COMPLETED',
          description: `Compra em ${parceiro.companyName}`,
        },
      })

      // Atualiza pontos e cashback do assinante
      await tx.assinante.update({
        where: { id: assinanteId },
        data: {
          points: {
            decrement: pointsUsed,
          },
          cashback: {
            increment: cashbackGenerated,
          },
        },
      })

      // Atualiza metricas do parceiro
      const currentMetrics = parceiro.metrics as {
        totalSales?: number
        salesAmount?: number
      }

      await tx.parceiro.update({
        where: { id: parceiro.id },
        data: {
          metrics: {
            ...currentMetrics,
            totalSales: (currentMetrics.totalSales || 0) + 1,
            salesAmount: (currentMetrics.salesAmount || 0) + amount,
          },
        },
      })

      return newTransaction
    })

    return NextResponse.json({
      message: 'Venda registrada com sucesso',
      data: {
        transactionId: transaction.id,
        amount,
        discount,
        pointsUsed,
        cashbackGenerated,
        finalAmount,
      },
    })
  } catch (error) {
    console.error('Erro ao confirmar venda:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

