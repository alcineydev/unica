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
    if (diffMins < 60) return `há ${diffMins}min`
    if (diffHours < 24) return `há ${diffHours}h`
    if (diffDays < 7) return `há ${diffDays}d`
    return date.toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">Ativo</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-700 border-0 text-[10px]">Pendente</Badge>
      case 'CANCELLED':
      case 'CANCELED':
        return <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">Cancelado</Badge>
      case 'SUSPENDED':
        return <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px]">Suspenso</Badge>
      default:
        return <Badge variant="secondary" className="text-[10px]">{status}</Badge>
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
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do sistema</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Total Assinantes */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 md:p-4 lg:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground truncate">
                  Total Assinantes
                </p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold mt-0.5">
                  {stats?.totalAssinantes || 0}
                </p>
                <div className={cn(
                  "flex items-center gap-1 mt-0.5 text-[10px] md:text-xs",
                  (stats?.assinantesGrowth || 0) >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {(stats?.assinantesGrowth || 0) >= 0 ? (
                    <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  )}
                  <span className="truncate">{stats?.assinantesGrowth || 0}%</span>
                </div>
              </div>
              <div className="p-1.5 md:p-2 lg:p-3 rounded-lg bg-blue-100 flex-shrink-0">
                <Users className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parceiros Ativos */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 md:p-4 lg:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground truncate">
                  Parceiros Ativos
                </p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold mt-0.5">
                  {stats?.parceirosAtivos || 0}
                </p>
                <div className={cn(
                  "flex items-center gap-1 mt-0.5 text-[10px] md:text-xs",
                  (stats?.parceirosGrowth || 0) >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {(stats?.parceirosGrowth || 0) >= 0 ? (
                    <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  )}
                  <span className="truncate">{stats?.parceirosGrowth || 0}%</span>
                </div>
              </div>
              <div className="p-1.5 md:p-2 lg:p-3 rounded-lg bg-purple-100 flex-shrink-0">
                <Building2 className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receita Mensal */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 md:p-4 lg:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground truncate">
                  Receita Mensal
                </p>
                <p className="text-sm md:text-xl lg:text-2xl font-bold mt-0.5 truncate">
                  {formatCurrency(stats?.receitaMensal || 0)}
                </p>
                <div className={cn(
                  "flex items-center gap-1 mt-0.5 text-[10px] md:text-xs",
                  (stats?.receitaGrowth || 0) >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {(stats?.receitaGrowth || 0) >= 0 ? (
                    <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  )}
                  <span className="truncate">{stats?.receitaGrowth || 0}%</span>
                </div>
              </div>
              <div className="p-1.5 md:p-2 lg:p-3 rounded-lg bg-green-100 flex-shrink-0">
                <DollarSign className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Conversão */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 md:p-4 lg:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground truncate">
                  Taxa Conversão
                </p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold mt-0.5">
                  {stats?.taxaConversao || 0}%
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 truncate">
                  {stats?.assinantesAtivos || 0}/{stats?.totalAssinantes || 0}
                </p>
              </div>
              <div className="p-1.5 md:p-2 lg:p-3 rounded-lg bg-orange-100 flex-shrink-0">
                <Activity className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico e Atividades */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Gráfico de Assinaturas */}
        <Card className="lg:col-span-3">
          <CardHeader className="p-3 md:p-4 lg:p-6 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm md:text-base lg:text-lg">Novas Assinaturas</CardTitle>
                <CardDescription className="text-xs md:text-sm">Últimos 30 dias</CardDescription>
              </div>
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
            {chartData.length > 0 ? (
              <div className="h-40 md:h-56 lg:h-64">
                {/* Gráfico de barras simples */}
                <div className="flex items-end justify-between h-32 md:h-44 lg:h-52 gap-0.5">
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
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-[10px] md:text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {new Date(data.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        <br />
                        {data.assinaturas}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Labels */}
                <div className="flex justify-between mt-2 text-[10px] md:text-xs text-muted-foreground">
                  <span>{chartData[0] && new Date(chartData[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  <span>{chartData[chartData.length - 1] && new Date(chartData[chartData.length - 1].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                </div>
              </div>
            ) : (
              <div className="h-40 md:h-56 lg:h-64 flex items-center justify-center text-muted-foreground text-sm">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atividades Recentes */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-3 md:p-4 lg:p-6 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm md:text-base lg:text-lg">Últimos Assinantes</CardTitle>
                <CardDescription className="text-xs md:text-sm">Cadastros recentes</CardDescription>
              </div>
              <Link href="/admin/assinantes">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs md:text-sm">
                  Ver todos
                  <ArrowRight className="ml-1 h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
            {activities.length > 0 ? (
              <div className="space-y-3 max-h-48 md:max-h-64 overflow-y-auto">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2 md:gap-3">
                    <UserAvatar 
                      src={activity.avatar}
                      name={activity.name}
                      size="sm"
                      className="h-7 w-7 md:h-8 md:w-8"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs md:text-sm truncate">{activity.name}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground truncate">{activity.email}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {getStatusBadge(activity.status)}
                        <span className="text-[10px] md:text-xs text-muted-foreground">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 md:py-8 text-muted-foreground">
                <Users className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs md:text-sm">Nenhum assinante ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader className="p-3 md:p-4 lg:p-6 pb-2">
          <CardTitle className="text-sm md:text-base lg:text-lg">Ações Rápidas</CardTitle>
          <CardDescription className="text-xs md:text-sm">Acesse as funcionalidades mais usadas</CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
          <div className="grid gap-2 md:gap-3 grid-cols-2 md:grid-cols-4">
            <Link href="/admin/assinantes">
              <Button variant="outline" className="w-full h-auto py-2.5 md:py-3 lg:py-4 flex flex-col gap-1 md:gap-2">
                <UserPlus className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-[10px] md:text-xs lg:text-sm font-medium">Novo Assinante</span>
              </Button>
            </Link>
            
            <Link href="/admin/parceiros/novo">
              <Button variant="outline" className="w-full h-auto py-2.5 md:py-3 lg:py-4 flex flex-col gap-1 md:gap-2">
                <Building2 className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-[10px] md:text-xs lg:text-sm font-medium">Novo Parceiro</span>
              </Button>
            </Link>
            
            <Link href="/admin/beneficios">
              <Button variant="outline" className="w-full h-auto py-2.5 md:py-3 lg:py-4 flex flex-col gap-1 md:gap-2">
                <Gift className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-[10px] md:text-xs lg:text-sm font-medium">Benefícios</span>
              </Button>
            </Link>
            
            <Link href="/admin/planos">
              <Button variant="outline" className="w-full h-auto py-2.5 md:py-3 lg:py-4 flex flex-col gap-1 md:gap-2">
                <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-[10px] md:text-xs lg:text-sm font-medium">Planos</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
