'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  Building2,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  UserPlus,
  Gift,
  DollarSign,
  Activity
} from 'lucide-react'
import { PageLoading } from '@/components/admin/loading-spinner'

interface DashboardStats {
  totalAssinantes: number
  assinantesAtivos: number
  assinantesGrowth: number
  parceirosAtivos: number
  parceirosGrowth: number
  receitaMensal: number
  receitaGrowth: number
  taxaConversao: number
}

interface RecentActivity {
  id: string
  type: string
  name: string
  email?: string
  avatar?: string
  plan?: string
  status: string
  createdAt: string
}

interface ChartDataPoint {
  date: string
  assinaturas: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      const data = await response.json()

      if (data.stats) {
        setStats(data.stats)
        setActivities(data.recentActivities || [])
        setChartData(data.chartData || [])
      }
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const statsCards = [
    {
      title: 'Total Assinantes',
      value: stats?.totalAssinantes || 0,
      change: `${stats?.assinantesGrowth || 0}%`,
      trend: (stats?.assinantesGrowth || 0) >= 0 ? 'up' : 'down',
      icon: Users,
      color: 'brand',
      href: '/admin/assinantes'
    },
    {
      title: 'Parceiros Ativos',
      value: stats?.parceirosAtivos || 0,
      change: `${stats?.parceirosGrowth || 0}%`,
      trend: (stats?.parceirosGrowth || 0) >= 0 ? 'up' : 'down',
      icon: Building2,
      color: 'success',
      href: '/admin/parceiros'
    },
    {
      title: 'Receita Mensal',
      value: formatCurrency(stats?.receitaMensal || 0),
      change: `${stats?.receitaGrowth || 0}%`,
      trend: (stats?.receitaGrowth || 0) >= 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'warning',
      href: '/admin/assinantes'
    },
    {
      title: 'Taxa Conversão',
      value: `${stats?.taxaConversao || 0}%`,
      change: `${stats?.assinantesAtivos || 0}/${stats?.totalAssinantes || 0}`,
      trend: 'neutral',
      icon: Activity,
      color: 'purple',
      href: '/admin/assinantes'
    },
  ]

  const colorClasses: Record<string, { bg: string; icon: string }> = {
    brand: {
      bg: 'bg-brand-100',
      icon: 'text-brand-600',
    },
    success: {
      bg: 'bg-success-100',
      icon: 'text-success-600',
    },
    warning: {
      bg: 'bg-warning-100',
      icon: 'text-warning-600',
    },
    purple: {
      bg: 'bg-purple-100',
      icon: 'text-purple-600',
    },
  }

  // Calcular máximo para o gráfico
  const maxAssinaturas = Math.max(...chartData.map(d => d.assinaturas), 1)

  if (isLoading) {
    return <PageLoading text="Carregando dashboard..." />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Visão geral do sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const colors = colorClasses[stat.color]
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString('pt-BR') : stat.value}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4 text-success-500" />
                    ) : stat.trend === 'down' ? (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    ) : null}
                    <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-success-600' :
                        stat.trend === 'down' ? 'text-red-600' :
                          'text-slate-500'
                      }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Novas Assinaturas</h2>
              <p className="text-sm text-slate-500">Últimos 30 dias</p>
            </div>
            <button className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
              <Calendar className="w-5 h-5" />
            </button>
          </div>

          {chartData.length > 0 ? (
            <div className="h-64">
              {/* Gráfico de barras simples */}
              <div className="flex items-end justify-between h-52 gap-0.5">
                {chartData.map((data, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-brand-200 hover:bg-brand-400 transition-colors rounded-t relative group cursor-pointer"
                    style={{
                      height: `${Math.max((data.assinaturas / maxAssinaturas) * 100, data.assinaturas > 0 ? 5 : 0)}%`,
                      minHeight: data.assinaturas > 0 ? '4px' : '0'
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {new Date(data.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      <br />
                      {data.assinaturas} {data.assinaturas === 1 ? 'assinatura' : 'assinaturas'}
                    </div>
                  </div>
                ))}
              </div>
              {/* Labels */}
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>{chartData[0] && new Date(chartData[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                <span>{chartData[chartData.length - 1] && new Date(chartData[chartData.length - 1].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400">Nenhum dado disponível</p>
            </div>
          )}
        </div>

        {/* Recent Subscribers */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Últimos Assinantes</h2>
              <p className="text-sm text-slate-500">Cadastros recentes</p>
            </div>
            <Link
              href="/admin/assinantes"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              Ver todos
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">
                      {activity.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {activity.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {activity.email}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${activity.status === 'ACTIVE'
                      ? 'bg-success-100 text-success-700'
                      : activity.status === 'PENDING'
                        ? 'bg-warning-100 text-warning-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                    {activity.status === 'ACTIVE' ? 'Ativo' :
                      activity.status === 'PENDING' ? 'Pendente' : activity.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-slate-500 py-8">
                Nenhum assinante cadastrado
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Ações Rápidas</h2>
          <p className="text-sm text-slate-500">Acesse as funcionalidades mais usadas</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/assinantes"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-all group"
          >
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserPlus className="w-6 h-6 text-brand-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">Novo Assinante</span>
          </Link>

          <Link
            href="/admin/parceiros/novo"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-success-300 hover:bg-success-50 transition-all group"
          >
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-success-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">Novo Parceiro</span>
          </Link>

          <Link
            href="/admin/beneficios"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-warning-300 hover:bg-warning-50 transition-all group"
          >
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Gift className="w-6 h-6 text-warning-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">Benefícios</span>
          </Link>

          <Link
            href="/admin/planos"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">Planos</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
