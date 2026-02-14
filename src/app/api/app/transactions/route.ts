import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ASSINANTE') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const assinante = await prisma.assinante.findUnique({
      where: { userId: session.user.id! },
      select: { id: true },
    })

    if (!assinante) {
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 50)

    const transactions = await prisma.transaction.findMany({
      where: { assinanteId: assinante.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        amount: true,
        cashbackGenerated: true,
        discountApplied: true,
        pointsUsed: true,
        description: true,
        status: true,
        createdAt: true,
        parceiro: {
          select: {
            id: true,
            tradeName: true,
            companyName: true,
            logo: true,
            category: true,
          },
        },
      },
    })

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        cashback: Number(t.cashbackGenerated),
        discount: Number(t.discountApplied),
        pointsUsed: Number(t.pointsUsed),
        description: t.description,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
        parceiro: t.parceiro
          ? {
              id: t.parceiro.id,
              name: t.parceiro.tradeName || t.parceiro.companyName,
              logo: t.parceiro.logo,
              category: t.parceiro.category,
            }
          : null,
      })),
    })
  } catch (error) {
    console.error('Erro ao buscar transações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
