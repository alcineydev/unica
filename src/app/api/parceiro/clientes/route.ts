import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar parceiro
    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id }
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Buscar transações do parceiro agrupadas por assinante
    const transactions = await prisma.transaction.findMany({
      where: {
        parceiroId: parceiro.id
      },
      include: {
        assinante: {
          include: {
            user: true,
            plan: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Agrupar por assinante
    const clientesMap = new Map<string, {
      id: string
      nome: string
      email: string
      avatar?: string
      phone: string
      cpf: string
      totalCompras: number
      valorTotal: number
      ultimaCompra?: string
      plano?: string
    }>()

    for (const tx of transactions) {
      if (!tx.assinante) continue

      const clienteId = tx.assinante.id
      const existing = clientesMap.get(clienteId)

      if (existing) {
        existing.totalCompras += 1
        existing.valorTotal += Number(tx.amount || 0)
        // Manter a data mais recente
        if (tx.createdAt && (!existing.ultimaCompra || new Date(tx.createdAt) > new Date(existing.ultimaCompra))) {
          existing.ultimaCompra = tx.createdAt.toISOString()
        }
      } else {
        clientesMap.set(clienteId, {
          id: tx.assinante.id,
          nome: tx.assinante.name || tx.assinante.user?.email?.split('@')[0] || 'Cliente',
          email: tx.assinante.user?.email || '',
          avatar: (tx.assinante.user as any)?.avatar || undefined,
          phone: tx.assinante.phone || '',
          cpf: tx.assinante.cpf || '',
          totalCompras: 1,
          valorTotal: Number(tx.amount || 0),
          ultimaCompra: tx.createdAt?.toISOString() || undefined,
          plano: tx.assinante.plan?.name || undefined
        })
      }
    }

    const clientes = Array.from(clientesMap.values())

    return NextResponse.json({ clientes })

  } catch (error) {
    console.error('[PARCEIRO CLIENTES] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 })
  }
}
