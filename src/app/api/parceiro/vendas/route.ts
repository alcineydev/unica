import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Listar vendas/transações do parceiro
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id }
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Buscar transações do parceiro
    const transacoes = await prisma.transaction.findMany({
      where: { 
        parceiroId: parceiro.id,
        type: 'PURCHASE'
      },
      include: {
        assinante: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({
      vendas: transacoes.map(t => ({
        id: t.id,
        valor: Number(t.amount),
        pontosUsados: Number(t.pointsUsed),
        cashbackGerado: Number(t.cashbackGenerated),
        desconto: Number(t.discountApplied),
        status: t.status,
        descricao: t.description,
        createdAt: t.createdAt.toISOString(),
        assinante: {
          id: t.assinante.id,
          nome: t.assinante.name,
          email: t.assinante.user?.email
        }
      }))
    })

  } catch (error) {
    console.error('[VENDAS GET] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar vendas' }, { status: 500 })
  }
}
