import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session || !['PARCEIRO', 'DEVELOPER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Buscar todos os saldos de cashback dos clientes
    const balances = await prisma.cashbackBalance.findMany({
      where: { parceiroId: parceiro.id },
      include: {
        assinante: {
          select: {
            id: true,
            name: true,
            cpf: true,
            user: {
              select: { avatar: true },
            },
          },
        },
      },
      orderBy: { balance: 'desc' },
    })

    // Totais
    const totalPending = balances.reduce((sum, b) => sum + Number(b.balance), 0)
    const totalIssued = balances.reduce((sum, b) => sum + Number(b.totalEarned), 0)
    const totalRedeemed = balances.reduce((sum, b) => sum + Number(b.totalUsed), 0)

    return NextResponse.json({
      data: {
        totalPending: Number(totalPending.toFixed(2)),
        totalIssued: Number(totalIssued.toFixed(2)),
        totalRedeemed: Number(totalRedeemed.toFixed(2)),
        clientCount: balances.filter(b => Number(b.balance) > 0).length,
        balances: balances.map(b => ({
          assinanteId: b.assinante.id,
          name: b.assinante.name,
          cpf: b.assinante.cpf,
          avatar: b.assinante.user?.avatar || null,
          balance: Number(b.balance),
          totalEarned: Number(b.totalEarned),
          totalUsed: Number(b.totalUsed),
          updatedAt: b.updatedAt,
        })),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar cashback balances:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
