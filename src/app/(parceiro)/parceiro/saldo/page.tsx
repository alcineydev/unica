'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Wallet,
  Users,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Transaction {
  id: string
  amount: number
  type: string
  status: string
  createdAt: string
  assinante: {
    name: string
  }
}

interface CashbackClient {
  assinanteId: string
  name: string
  cpf: string
  avatar: string | null
  balance: number
  totalEarned: number
  totalUsed: number
  updatedAt: string
}

interface SaldoData {
  totalSales: number
  salesAmount: number
  pendingAmount: number
  cashbackTotals?: {
    totalPending: number
    totalIssued: number
    totalRedeemed: number
  }
  cashbackBalances?: CashbackClient[]
  transactions: Transaction[]
}

export default function ParceiroSaldoPage() {
  const [data, setData] = useState<SaldoData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSaldo = useCallback(async () => {
    try {
      const response = await fetch('/api/parceiro/saldo')
      const result = await response.json()
      if (response.ok) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar saldo:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSaldo()
  }, [fetchSaldo])

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Saldo</h1>
        <p className="text-muted-foreground">
          Acompanhe seus ganhos e transacoes
        </p>
      </div>

      {/* Cards de Saldo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas Totais
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">{data?.totalSales || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(data?.salesAmount || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendente
            </CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(data?.pendingAmount || 0)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historico de Transacoes */}
      <Card>
        <CardHeader>
          <CardTitle>Historico de Transacoes</CardTitle>
          <CardDescription>
            Todas as vendas realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4">
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : data?.transactions && data.transactions.length > 0 ? (
            <div className="space-y-4">
              {data.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${
                      tx.type === 'PURCHASE' 
                        ? 'bg-green-500/10' 
                        : 'bg-red-500/10'
                    }`}>
                      {tx.type === 'PURCHASE' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{tx.assinante.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      tx.type === 'PURCHASE' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'PURCHASE' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        tx.status === 'COMPLETED'
                          ? 'bg-green-500/10 text-green-600 border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                      }
                    >
                      {tx.status === 'COMPLETED' ? 'Concluido' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma transacao ainda
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== CASHBACK DOS CLIENTES ===== */}
      {data?.cashbackBalances && data.cashbackBalances.length > 0 && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Wallet className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Cashback dos Clientes</h2>
                <p className="text-xs text-muted-foreground">Saldo que clientes têm para usar aqui</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-amber-600">
                {formatCurrency(data.cashbackTotals?.totalPending || 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">pendente total</p>
            </div>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-sm font-bold text-blue-600">
                  {formatCurrency(data.cashbackTotals?.totalIssued || 0)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Emitido</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-sm font-bold text-green-600">
                  {formatCurrency(data.cashbackTotals?.totalRedeemed || 0)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Resgatado</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-sm font-bold text-amber-600">
                  {formatCurrency(data.cashbackTotals?.totalPending || 0)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Pendente</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de clientes */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">
                  {data.cashbackBalances.length} {data.cashbackBalances.length === 1 ? 'cliente' : 'clientes'} com saldo
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {data.cashbackBalances.map((client) => (
                  <div key={client.assinanteId} className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-gray-200">
                        <AvatarImage src={client.avatar || undefined} />
                        <AvatarFallback className="bg-gray-100 text-gray-500 text-xs font-semibold">
                          {client.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{client.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {client.cpf ? `***.***.${client.cpf.slice(-5, -2)}-${client.cpf.slice(-2)}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        {formatCurrency(client.balance)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        ganho: {formatCurrency(client.totalEarned)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

