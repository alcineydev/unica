import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { subDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || '30dias'

    // Calcular datas
    let dataInicio: Date
    let dataFim = new Date()

    switch (periodo) {
      case '7dias':
        dataInicio = subDays(new Date(), 7)
        break
      case 'semana':
        dataInicio = startOfWeek(new Date(), { locale: ptBR })
        dataFim = endOfWeek(new Date(), { locale: ptBR })
        break
      case 'mes':
        dataInicio = startOfMonth(new Date())
        dataFim = endOfMonth(new Date())
        break
      default: // 30dias
        dataInicio = subDays(new Date(), 30)
    }

    // Buscar parceiro
    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id }
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Buscar transações do período
    const transactions = await prisma.transaction.findMany({
      where: {
        parceiroId: parceiro.id,
        createdAt: {
          gte: dataInicio,
          lte: dataFim
        }
      },
      include: {
        assinante: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Calcular dias no período
    const diasPeriodo = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Agrupar vendas por dia
    const vendasPorDiaMap = new Map<string, { vendas: number; valor: number }>()

    // Inicializar todos os dias
    for (let i = 0; i < diasPeriodo; i++) {
      const data = subDays(dataFim, diasPeriodo - 1 - i)
      const dataStr = format(data, 'dd/MM', { locale: ptBR })
      vendasPorDiaMap.set(dataStr, { vendas: 0, valor: 0 })
    }

    // Preencher com dados reais
    for (const tx of transactions) {
      const dataStr = format(tx.createdAt, 'dd/MM', { locale: ptBR })
      const existing = vendasPorDiaMap.get(dataStr)
      if (existing) {
        existing.vendas += 1
        existing.valor += Number(tx.amount || 0)
      }
    }

    const vendasPorDia = Array.from(vendasPorDiaMap.entries()).map(([data, stats]) => ({
      data,
      vendas: stats.vendas,
      valor: stats.valor
    }))

    // Calcular totais
    const totalVendas = transactions.length
    const valorTotal = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
    const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0

    // Agrupar por cliente para top clientes
    const clientesMap = new Map<string, { nome: string; avatar?: string; compras: number; valor: number }>()

    for (const tx of transactions) {
      if (!tx.assinante) continue

      const clienteId = tx.assinante.id
      const existing = clientesMap.get(clienteId)

      if (existing) {
        existing.compras += 1
        existing.valor += Number(tx.amount || 0)
      } else {
        clientesMap.set(clienteId, {
          nome: tx.assinante.name || tx.assinante.user?.email?.split('@')[0] || 'Cliente',
          avatar: (tx.assinante.user as any)?.avatar || undefined,
          compras: 1,
          valor: Number(tx.amount || 0)
        })
      }
    }

    const topClientes = Array.from(clientesMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)

    // Contar novos clientes (primeira compra no período)
    const clientesUnicos = new Set(transactions.map(tx => tx.assinanteId)).size

    // Calcular crescimento (comparar com período anterior)
    const periodoAnteriorInicio = subDays(dataInicio, diasPeriodo)
    const transacoesAnteriores = await prisma.transaction.count({
      where: {
        parceiroId: parceiro.id,
        createdAt: {
          gte: periodoAnteriorInicio,
          lt: dataInicio
        }
      }
    })

    const crescimentoVendas = transacoesAnteriores > 0
      ? Math.round(((totalVendas - transacoesAnteriores) / transacoesAnteriores) * 100)
      : totalVendas > 0 ? 100 : 0

    // Calcular crescimento de valor
    const valorAnterior = await prisma.transaction.aggregate({
      where: {
        parceiroId: parceiro.id,
        createdAt: {
          gte: periodoAnteriorInicio,
          lt: dataInicio
        }
      },
      _sum: {
        amount: true
      }
    })

    const valorAnteriorTotal = Number(valorAnterior._sum.amount || 0)
    const crescimentoValor = valorAnteriorTotal > 0
      ? Math.round(((valorTotal - valorAnteriorTotal) / valorAnteriorTotal) * 100)
      : valorTotal > 0 ? 100 : 0

    return NextResponse.json({
      relatorio: {
        periodo,
        totalVendas,
        valorTotal,
        ticketMedio,
        novosClientes: clientesUnicos,
        crescimentoVendas,
        crescimentoValor,
        vendasPorDia,
        topClientes
      }
    })

  } catch (error) {
    console.error('[PARCEIRO RELATORIOS] Erro:', error)
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 })
  }
}
