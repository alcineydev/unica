'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  ScrollText,
  Database,
  Activity,
  ArrowRight,
  RefreshCw,
  Shield,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import { PageLoading, StatsCard, PageHeader } from '@/components/developer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DashboardStats {
  totalAdmins: number
  totalLogs: number
  totalUsers: number
  dbStatus: string
  totalParceiros?: number
  totalAssinantes?: number
  totalPlanos?: number
}

interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ElementType
  color: 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'cyan'
}

const quickActions: QuickAction[] = [
  {
    title: 'Gerenciar Admins',
    description: 'Criar ou remover administradores',
    href: '/developer/admins',
    icon: Users,
    color: 'blue',
  },
  {
    title: 'Ver Logs',
    description: 'Monitorar atividades do sistema',
    href: '/developer/logs',
    icon: ScrollText,
    color: 'amber',
  },
  {
    title: 'Monitoramento',
    description: 'Status em tempo real',
    href: '/developer/monitoramento',
    icon: Activity,
    color: 'green',
  },
  {
    title: 'Banco de Dados',
    description: 'Gerenciar dados e backups',
    href: '/developer/database',
    icon: Database,
    color: 'purple',
  },
]

const systemStatus = [
  { name: 'API Server', status: 'online', icon: Server },
  { name: 'Database', status: 'online', icon: Database },
  { name: 'Cache', status: 'online', icon: Cpu },
  { name: 'Storage', status: 'online', icon: HardDrive },
  { name: 'CDN', status: 'online', icon: Wifi },
]

export default function DeveloperDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/developer/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchStats()
  }

  if (loading) {
    return <PageLoading text="Carregando dashboard..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Dashboard Developer"
        description="Visão geral do sistema e ferramentas de desenvolvimento"
        icon={<Shield className="h-6 w-6" />}
        actions={
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Atualizar
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Administradores"
          value={stats?.totalAdmins || 0}
          icon={<Users className="h-6 w-6" />}
          color="blue"
          description="Usuários com acesso admin"
        />
        <StatsCard
          title="Logs do Sistema"
          value={stats?.totalLogs || 0}
          icon={<ScrollText className="h-6 w-6" />}
          color="amber"
          description="Registros de atividade"
        />
        <StatsCard
          title="Total de Usuários"
          value={stats?.totalUsers || 0}
          icon={<Activity className="h-6 w-6" />}
          color="green"
          description="Todos os usuários"
        />
        <StatsCard
          title="Status do Banco"
          value={stats?.dbStatus === 'connected' ? 'Online' : 'Offline'}
          icon={<Database className="h-6 w-6" />}
          color={stats?.dbStatus === 'connected' ? 'green' : 'red'}
          description="PostgreSQL / Supabase"
        />
      </div>

      {/* Quick Actions + System Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white">Ações Rápidas</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-4 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 transition-all hover:border-red-500/50 hover:bg-zinc-800"
              >
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  action.color === 'blue' && 'bg-blue-500/20 text-blue-400',
                  action.color === 'amber' && 'bg-amber-500/20 text-amber-400',
                  action.color === 'green' && 'bg-green-500/20 text-green-400',
                  action.color === 'purple' && 'bg-purple-500/20 text-purple-400',
                )}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white group-hover:text-red-400 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-zinc-400">{action.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-zinc-600 transition-transform group-hover:translate-x-1 group-hover:text-red-400" />
              </Link>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Status do Sistema</h2>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <ul className="space-y-3">
              {systemStatus.map((service) => (
                <li
                  key={service.name}
                  className="flex items-center justify-between rounded-lg bg-zinc-900/50 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <service.icon className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm text-zinc-300">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.status === 'online' ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : service.status === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className={cn(
                      'text-xs font-medium',
                      service.status === 'online' && 'text-green-400',
                      service.status === 'warning' && 'text-amber-400',
                      service.status === 'offline' && 'text-red-400',
                    )}>
                      {service.status === 'online' ? 'Online' : service.status === 'warning' ? 'Alerta' : 'Offline'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Uptime */}
            <div className="mt-4 pt-4 border-t border-zinc-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Uptime</span>
                <span className="font-medium text-green-400">99.9%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-zinc-700 overflow-hidden">
                <div className="h-full w-[99.9%] rounded-full bg-gradient-to-r from-green-500 to-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Preview */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Atividade Recente</h2>
          <Link
            href="/developer/logs"
            className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="text-center py-8 text-zinc-500">
          <ScrollText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Acesse a página de Logs para ver a atividade completa</p>
        </div>
      </div>
    </div>
  )
}
