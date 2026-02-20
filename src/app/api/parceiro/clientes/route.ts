import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const parceiro = await prisma.parceiro.findUnique({
      where: { userId: session.user.id },
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Buscar transações do parceiro com dados do assinante
    const transactions = await prisma.transaction.findMany({
      where: { parceiroId: parceiro.id },
      include: {
        assinante: {
          select: {
            id: true,
            name: true,
            cpf: true,
            phone: true,
            subscriptionStatus: true,
            user: {
              select: {
                id: true,
                email: true,
                avatar: true,
              },
            },
            plan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Buscar saldos de cashback deste parceiro
    const cashbackBalances = await prisma.cashbackBalance.findMany({
      where: { parceiroId: parceiro.id },
      select: {
        assinanteId: true,
        balance: true,
        totalEarned: true,
        totalUsed: true,
      },
    })

    const cashbackMap = new Map(
      cashbackBalances.map((cb) => [cb.assinanteId, cb])
    )

    // Início do mês atual para comparativo mensal
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    // Agrupar transações por assinante
    type ClienteData = {
      assinante: (typeof transactions)[0]['assinante']
      compras: number
      comprasMes: number
      gastoTotal: number
      gastoMes: number
      ultimaCompra: Date | null
      txs: {
        id: string
        type: string
        amount: number
        discountApplied: number
        cashbackGenerated: number
        cashbackUsed: number
        description: string
        createdAt: Date
      }[]
    }

    const clienteMap = new Map<string, ClienteData>()

    for (const tx of transactions) {
      if (!tx.assinante) continue

      const aid = tx.assinanteId

      if (!clienteMap.has(aid)) {
        clienteMap.set(aid, {
          assinante: tx.assinante,
          compras: 0,
          comprasMes: 0,
          gastoTotal: 0,
          gastoMes: 0,
          ultimaCompra: null,
          txs: [],
        })
      }

      const c = clienteMap.get(aid)!
      const amount = Number(tx.amount) || 0

      c.compras++
      c.gastoTotal += amount

      if (tx.createdAt >= inicioMes) {
        c.comprasMes++
        c.gastoMes += amount
      }

      if (!c.ultimaCompra || tx.createdAt > c.ultimaCompra) {
        c.ultimaCompra = tx.createdAt
      }

      // Guardar últimas 5 transações
      if (c.txs.length < 5) {
        c.txs.push({
          id: tx.id,
          type: tx.type,
          amount,
          discountApplied: Number(tx.discountApplied) || 0,
          cashbackGenerated: Number(tx.cashbackGenerated) || 0,
          cashbackUsed: Number(tx.cashbackUsed) || 0,
          description: tx.description,
          createdAt: tx.createdAt,
        })
      }
    }

    // Montar lista de clientes
    const clientes = Array.from(clienteMap.values()).map((c) => {
      const cb = cashbackMap.get(c.assinante!.id)
      const isActive = c.assinante!.subscriptionStatus === 'ACTIVE'

      return {
        id: c.assinante!.id,
        name: c.assinante!.name || 'Sem nome',
        email: c.assinante!.user?.email || '',
        avatar: c.assinante!.user?.avatar || null,
        cpf: c.assinante!.cpf || '',
        phone: c.assinante!.phone || '',
        plan: c.assinante!.plan?.name || 'Sem plano',
        subscriptionStatus: c.assinante!.subscriptionStatus,
        isActive,
        compras: c.compras,
        comprasMes: c.comprasMes,
        gastoTotal: c.gastoTotal,
        gastoMes: c.gastoMes,
        cashbackAcumulado: Number(cb?.totalEarned) || 0,
        cashbackUsado: Number(cb?.totalUsed) || 0,
        cashbackDisponivel: Number(cb?.balance) || 0,
        ultimaCompra: c.ultimaCompra,
        transactions: c.txs,
      }
    })

    // Stats globais
    const totalClientes = clientes.length
    const clientesMes = clientes.filter((c) => c.comprasMes > 0).length
    const faturamentoTotal = clientes.reduce((s, c) => s + c.gastoTotal, 0)
    const faturamentoMes = clientes.reduce((s, c) => s + c.gastoMes, 0)
    const totalCompras = clientes.reduce((s, c) => s + c.compras, 0)
    const comprasMes = clientes.reduce((s, c) => s + c.comprasMes, 0)
    const comWhatsapp = clientes.filter((c) => c.phone).length

    return NextResponse.json({
      clientes,
      stats: {
        totalClientes,
        clientesMes,
        faturamentoTotal,
        faturamentoMes,
        totalCompras,
        comprasMes,
        comWhatsapp,
        percentWhatsapp:
          totalClientes > 0
            ? Math.round((comWhatsapp / totalClientes) * 100)
            : 0,
      },
    })
  } catch (error) {
    console.error('[PARCEIRO_CLIENTES]', error)
    return NextResponse.json(
      { error: 'Erro ao buscar clientes' },
      { status: 500 }
    )
  }
}
