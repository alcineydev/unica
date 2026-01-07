'use client'

import { useState, useEffect } from 'react'
import {
  Terminal,
  Building2,
  UserCheck,
  Gift,
  CreditCard,
  FolderTree,
  MapPin,
  Activity,
  Shield,
  AlertTriangle,
  LogIn,
  TrendingUp,
  Clock,
  RefreshCw,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

interface Stats {
  counts: {
    admins: { total: number; active: number }
    parceiros: { total: number; active: number }
    assinantes: { total: number; active: number }
    beneficios: number
    planos: number
    categorias: number
    cidades: number
  }
  logs: {
    total: number
    byType: Record<string, number>
    loginsToday: number
    loginFailuresToday: number
  }
  activity: Array<{ date: string; day: string; count: number }>
  recentLogs: Array<{
    id: string
    type: string
    action: string
    message: string
    user: string
    createdAt: string
  }>
}

const typeColors: Record<string, string> = {
  AUTH: '#3B82F6',
  ADMIN: '#8B5CF6',
  SYSTEM: '#6B7280',
  PARTNER: '#10B981',
  SUBSCRIBER: '#14B8A6',
  ERROR: '#EF4444',
  CONFIG: '#F59E0B',
}

export default function DeveloperDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/developer/stats')
      const data = await response.json()
      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 font-mono">loading_dashboard()...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      label: 'admins',
      value: stats.counts.admins.total,
      active: stats.counts.admins.active,
      icon: Shield,
      color: 'violet'
    },
    {
      label: 'parceiros',
      value: stats.counts.parceiros.total,
      active: stats.counts.parceiros.active,
      icon: Building2,
      color: 'emerald'
    },
    {
      label: 'assinantes',
      value: stats.counts.assinantes.total,
      active: stats.counts.assinantes.active,
      icon: UserCheck,
      color: 'cyan'
    },
    {
      label: 'beneficios',
      value: stats.counts.beneficios,
      icon: Gift,
      color: 'amber'
    },
    {
      label: 'planos',
      value: stats.counts.planos,
      icon: CreditCard,
      color: 'blue'
    },
    {
      label: 'categorias',
      value: stats.counts.categorias,
      icon: FolderTree,
      color: 'pink'
    },
    {
      label: 'cidades',
      value: stats.counts.cidades,
      icon: MapPin,
      color: 'orange'
    },
    {
      label: 'logs',
      value: stats.logs.total,
      icon: FileText,
      color: 'slate'
    },
  ]

  const colorClasses: Record<string, string> = {
    violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    slate: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  }

  const logTypeData = Object.entries(stats.logs.byType).map(([type, count]) => ({
    name: type,
    value: count,
    fill: typeColors[type] || '#6B7280',
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
            <Terminal className="w-6 h-6 text-emerald-400" />
            dashboard()
          </h1>
          <p className="text-slate-500 font-mono text-sm">// visao geral do sistema</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-slate-900 rounded-xl text-sm font-bold hover:bg-emerald-400 transition-all font-mono disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          refresh()
        </button>
      </div>

      {/* Auth Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <LogIn className="w-5 h-5 text-emerald-400" />
            <span className="text-slate-400 text-sm font-mono">logins_hoje</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400 font-mono">{stats.logs.loginsToday}</p>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-slate-400 text-sm font-mono">login_falhos</span>
          </div>
          <p className="text-3xl font-bold text-red-400 font-mono">{stats.logs.loginFailuresToday}</p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span className="text-slate-400 text-sm font-mono">atividade_7d</span>
          </div>
          <p className="text-3xl font-bold text-blue-400 font-mono">
            {stats.activity.reduce((sum, day) => sum + day.count, 0)}
          </p>
        </div>

        <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            <span className="text-slate-400 text-sm font-mono">total_logs</span>
          </div>
          <p className="text-3xl font-bold text-violet-400 font-mono">{stats.logs.total}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={`p-4 rounded-xl border ${colorClasses[stat.color]}`}
            >
              <Icon className="w-5 h-5 mb-2 opacity-80" />
              <p className="text-2xl font-bold font-mono">{stat.value}</p>
              <p className="text-xs opacity-70 font-mono">{stat.label}</p>
              {stat.active !== undefined && (
                <p className="text-xs opacity-50 font-mono mt-1">
                  {stat.active} ativos
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-white font-mono font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            activity_7_days[]
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.activity}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorActivity)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Logs by Type Chart */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-white font-mono font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            logs_by_type[]
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={logTypeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={12} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#64748B"
                  fontSize={11}
                  width={80}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-white font-mono font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          recent_logs[]
        </h3>
        <div className="space-y-3">
          {stats.recentLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50"
            >
              <div className="flex items-center gap-3">
                <span
                  className="px-2 py-1 rounded text-xs font-mono"
                  style={{
                    backgroundColor: `${typeColors[log.type] || '#6B7280'}20`,
                    color: typeColors[log.type] || '#6B7280',
                  }}
                >
                  {log.type}
                </span>
                <span className="text-slate-300 text-sm">{log.message}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="font-mono">{log.user}</span>
                <span className="font-mono">
                  {format(new Date(log.createdAt), 'HH:mm:ss', { locale: ptBR })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
