import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ASSINANTE') {
      return NextResponse.json(
        { error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    // Busca o assinante
    const assinante = await prisma.assinante.findUnique({
      where: { userId: session.user.id! },
      include: {
        plan: true,
      },
    })

    if (!assinante) {
      return NextResponse.json(
        { error: 'Assinante nao encontrado' },
        { status: 404 }
      )
    }

    // Busca transacoes
    const transactions = await prisma.transaction.findMany({
      where: { assinanteId: assinante.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        parceiro: {
          select: {
            companyName: true,
            tradeName: true,
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
          cashback: Number(assinante.cashback),
          plan: assinante.plan ? {
            name: assinante.plan.name,
          } : null,
        },
        transactions: transactions.map(tx => ({
          id: tx.id,
          amount: Number(tx.amount),
          pointsUsed: Number(tx.pointsUsed),
          cashbackGenerated: Number(tx.cashbackGenerated),
          type: tx.type,
          status: tx.status,
          createdAt: tx.createdAt.toISOString(),
          parceiro: tx.parceiro,
        })),
      },
    })
  } catch (error) {
    console.error('Erro ao carregar carteira:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

