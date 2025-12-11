'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, ScrollText, Shield, Database } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalAdmins: number
  totalLogs: number
  totalUsers: number
  dbStatus: string
}

export default function DeveloperDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAdmins: 0,
    totalLogs: 0,
    totalUsers: 0,
    dbStatus: 'Verificando...'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
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
      }
    }
    loadStats()
  }, [])

  const statCards = [
    {
      title: 'Administradores',
      value: stats.totalAdmins,
      icon: Users,
      href: '/developer/admins',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Logs do Sistema',
      value: stats.totalLogs,
      icon: ScrollText,
      href: '/developer/logs',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      icon: Shield,
      href: '#',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Status do Banco',
      value: stats.dbStatus,
      icon: Database,
      href: '#',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      isText: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Developer</h1>
        <p className="text-zinc-400 mt-1">
          Visão geral do sistema e acesso às ferramentas de desenvolvimento
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-750 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold text-white ${loading ? 'animate-pulse' : ''}`}>
                  {loading ? '...' : stat.isText ? stat.value : stat.value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Link
            href="/developer/admins"
            className="flex items-center gap-3 p-4 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors"
          >
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium text-white">Gerenciar Admins</p>
              <p className="text-sm text-zinc-400">Criar ou remover administradores</p>
            </div>
          </Link>
          
          <Link
            href="/developer/logs"
            className="flex items-center gap-3 p-4 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors"
          >
            <ScrollText className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-medium text-white">Ver Logs</p>
              <p className="text-sm text-zinc-400">Monitorar atividades do sistema</p>
            </div>
          </Link>
          
          <Link
            href="/developer/configuracoes"
            className="flex items-center gap-3 p-4 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors"
          >
            <Shield className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium text-white">Configurações</p>
              <p className="text-sm text-zinc-400">Ajustes avançados do sistema</p>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

