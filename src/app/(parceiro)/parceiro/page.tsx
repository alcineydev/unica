'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  TrendingUp,
  Eye,
  Star,
  ShoppingCart,
  DollarSign,
  QrCode,
  Loader2,
  ArrowUpRight
} from 'lucide-react'
import { StatsCard } from '@/components/parceiro/stats-card'

interface DashboardData {
  totalSales: number
  salesAmount: number
  pageViews: number
  whatsappClicks: number
  salesGrowth?: number
  avaliacoes?: {
    total: number
    media: number
  }
  recentTransactions: {
    id: string
    amount: number
    createdAt: string
    assinante: {
      name: string
    }
  }[]
}

export default function ParceiroDashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch('/api/parceiro/dashboard')
      const result = await response.json()
      if (response.ok) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'agora'
    if (diffMins < 60) return `há ${diffMins} min`
    if (diffHours < 24) return `há ${diffHours}h`
    return date.toLocaleDateString('pt-BR')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-500">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Bem-vindo, {session?.user?.name}!</p>
        </div>
        <Link
          href="/parceiro/vendas"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 shadow-sm hover:shadow-md transition-all"
        >
          <QrCode className="w-4 h-4" />
          Registrar Venda
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Vendas do Mês"
          value={data?.totalSales ?? 0}
          icon={ShoppingCart}
          color="emerald"
          trend={data?.salesGrowth !== undefined ? {
            value: `${Math.abs(data.salesGrowth)}%`,
            isPositive: data.salesGrowth >= 0
          } : undefined}
        />
        <StatsCard
          title="Faturamento"
          value={formatCurrency(data?.salesAmount ?? 0)}
          subtitle="Este mês"
          icon={DollarSign}
          color="blue"
        />
        <StatsCard
          title="Visualizações"
          value={data?.pageViews ?? 0}
          subtitle="Perfil da empresa"
          icon={Eye}
          color="purple"
        />
        <StatsCard
          title="Avaliações"
          value={(data?.avaliacoes?.media ?? 0).toFixed(1)}
          subtitle={`${data?.avaliacoes?.total ?? 0} avaliações`}
          icon={Star}
          color="amber"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendas Recentes */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Vendas Recentes</h2>
              <p className="text-sm text-slate-500">Últimas transações realizadas</p>
            </div>
            <Link
              href="/parceiro/vendas"
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              Ver todas
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recentTransactions && data.recentTransactions.length > 0 ? (
              data.recentTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 text-sm font-medium">
                        {tx.assinante.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{tx.assinante.name}</p>
                      <p className="text-xs text-slate-500">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhuma venda registrada</p>
                <Link
                  href="/parceiro/vendas"
                  className="text-emerald-600 hover:underline text-sm mt-2 inline-block"
                >
                  Registrar primeira venda
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Ações Rápidas</h2>

          <div className="space-y-3">
            <Link
              href="/parceiro/vendas"
              className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all"
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Escanear QR Code</p>
                <p className="text-sm text-emerald-100">Registrar venda com QR do cliente</p>
              </div>
            </Link>

            <Link
              href="/parceiro/saldo"
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <DollarSign className="w-5 h-5 text-slate-600 group-hover:text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Ver Saldo</p>
                <p className="text-sm text-slate-500">Consultar créditos acumulados</p>
              </div>
            </Link>

            <Link
              href="/parceiro/perfil"
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <TrendingUp className="w-5 h-5 text-slate-600 group-hover:text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Minha Empresa</p>
                <p className="text-sm text-slate-500">Atualizar informações</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
