'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { 
  Users, 
  Building2, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  UserPlus,
  Gift,
  CreditCard,
  ArrowRight,
  Loader2,
  Activity,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

export default function DashboardPage() {
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'agora'
    if (diffMins < 60) return `há ${diffMins} min`
    if (diffHours < 24) return `há ${diffHours}h`
    if (diffDays < 7) return `há ${diffDays}d`
    return date.toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-700 border-0">Ativo</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-700 border-0">Pendente</Badge>
      case 'CANCELLED':
      case 'CANCELED':
        return <Badge className="bg-red-100 text-red-700 border-0">Cancelado</Badge>
      case 'SUSPENDED':
        return <Badge className="bg-orange-100 text-orange-700 border-0">Suspenso</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Calcular máximo para o gráfico
  const maxAssinaturas = Math.max(...chartData.map(d => d.assinaturas), 1)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total Assinantes */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Assinantes</p>
                <p className="text-xl md:text-3xl font-bold mt-1">
                  {stats?.totalAssinantes || 0}
                </p>
                <div className={cn(
                  "flex items-center gap-1 mt-1 text-xs",
                  (stats?.assinantesGrowth || 0) >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {(stats?.assinantesGrowth || 0) >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{stats?.assinantesGrowth || 0}% vs mês anterior</span>
                </div>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-blue-100">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parceiros Ativos */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Parceiros Ativos</p>
                <p className="text-xl md:text-3xl font-bold mt-1">
                  {stats?.parceirosAtivos || 0}
                </p>
                <div className={cn(
                  "flex items-center gap-1 mt-1 text-xs",
                  (stats?.parceirosGrowth || 0) >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {(stats?.parceirosGrowth || 0) >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{stats?.parceirosGrowth || 0}% vs mês anterior</span>
                </div>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-purple-100">
                <Building2 className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receita Mensal */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Receita Mensal</p>
                <p className="text-lg md:text-2xl font-bold mt-1">
                  {formatCurrency(stats?.receitaMensal || 0)}
                </p>
                <div className={cn(
                  "flex items-center gap-1 mt-1 text-xs",
                  (stats?.receitaGrowth || 0) >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {(stats?.receitaGrowth || 0) >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{stats?.receitaGrowth || 0}% vs mês anterior</span>
                </div>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-green-100">
                <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Conversão */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Taxa Conversão</p>
                <p className="text-xl md:text-3xl font-bold mt-1">
                  {stats?.taxaConversao || 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.assinantesAtivos || 0} ativos de {stats?.totalAssinantes || 0}
                </p>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-orange-100">
                <Activity className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico e Atividades */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Gráfico de Assinaturas */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Novas Assinaturas</CardTitle>
                <CardDescription>Últimos 30 dias</CardDescription>
              </div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-64">
                {/* Gráfico de barras simples */}
                <div className="flex items-end justify-between h-48 gap-0.5">
                  {chartData.map((data, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t relative group cursor-pointer"
                      style={{
                        height: `${Math.max((data.assinaturas / maxAssinaturas) * 100, data.assinaturas > 0 ? 5 : 0)}%`,
                        minHeight: data.assinaturas > 0 ? '4px' : '0'
                      }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {new Date(data.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        <br />
                        {data.assinaturas} assinatura(s)
                      </div>
                    </div>
                  ))}
                </div>
                {/* Labels */}
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{chartData[0] && new Date(chartData[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  <span>{chartData[chartData.length - 1] && new Date(chartData[chartData.length - 1].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atividades Recentes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Últimos Assinantes</CardTitle>
                <CardDescription>Cadastros recentes</CardDescription>
              </div>
              <Link href="/admin/assinantes">
                <Button variant="ghost" size="sm">
                  Ver todos
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <UserAvatar 
                      src={activity.avatar}
                      name={activity.name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{activity.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(activity.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum assinante ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          <CardDescription>Acesse as funcionalidades mais usadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <Link href="/admin/assinantes">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <UserPlus className="h-5 w-5" />
                <div className="text-center">
                  <p className="font-medium text-sm">Novo Assinante</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">Cadastrar manualmente</p>
                </div>
              </Button>
            </Link>
            
            <Link href="/admin/parceiros/novo">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Building2 className="h-5 w-5" />
                <div className="text-center">
                  <p className="font-medium text-sm">Novo Parceiro</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">Adicionar empresa</p>
                </div>
              </Button>
            </Link>
            
            <Link href="/admin/beneficios">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Gift className="h-5 w-5" />
                <div className="text-center">
                  <p className="font-medium text-sm">Benefícios</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">Gerenciar benefícios</p>
                </div>
              </Button>
            </Link>
            
            <Link href="/admin/planos">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <CreditCard className="h-5 w-5" />
                <div className="text-center">
                  <p className="font-medium text-sm">Planos</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">Gerenciar planos</p>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
