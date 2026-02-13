'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Users,
  UserCheck,
  Clock,
  Crown,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  UserPlus,
  Percent,
} from 'lucide-react'

interface StatusItem {
  status: string
  count: number
}

interface PlanItem {
  planId: string
  planName: string
  price: number
  count: number
}

interface MonthlyItem {
  month: string
  count: number
}

interface DashboardStats {
  totals: {
    total: number
    active: number
    pending: number
    inactive: number
    canceled: number
    guest: number
  }
  revenue: {
    monthly: number
    perUser: number
  }
  trends: {
    newLast30Days: number
    canceledLast30Days: number
    conversionRate: number
  }
  charts: {
    byStatus: StatusItem[]
    byPlan: PlanItem[]
    semPlano: number
    monthlyNew: MonthlyItem[]
  }
}

interface DashboardProps {
  stats: DashboardStats | null
  loading: boolean
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativos',
  PENDING: 'Pendentes',
  INACTIVE: 'Inativos',
  SUSPENDED: 'Suspensos',
  CANCELED: 'Cancelados',
  EXPIRED: 'Expirados',
  GUEST: 'Convidados',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#10b981',
  PENDING: '#f59e0b',
  INACTIVE: '#6b7280',
  SUSPENDED: '#ef4444',
  CANCELED: '#dc2626',
  EXPIRED: '#9ca3af',
  GUEST: '#8b5cf6',
}

export default function SubscribersDashboard({
  stats,
  loading,
}: DashboardProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
    )
  }

  const { totals, revenue, trends, charts } = stats

  const maxMonthlyCount = Math.max(
    ...charts.monthlyNew.map((m) => m.count),
    1
  )
  const totalByPlan =
    charts.byPlan.reduce((sum, p) => sum + p.count, 0) + charts.semPlano
  const totalByStatus =
    charts.byStatus.reduce((sum, s) => sum + s.count, 0) || 1

  return (
    <div className="space-y-4">
      {/* Linha 1: Cards de métricas principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Total Assinantes
                </p>
                <p className="text-2xl font-bold">{totals.total}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <UserPlus className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600 font-medium">
                +{trends.newLast30Days}
              </span>
              <span className="text-xs text-muted-foreground">
                últimos 30 dias
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Ativos */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Ativos
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {totals.active}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-950/30">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Percent className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium">
                {trends.conversionRate}%
              </span>
              <span className="text-xs text-muted-foreground">
                taxa conversão
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Receita Mensal */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Receita Mensal
                </p>
                <p className="text-2xl font-bold">
                  R$ {revenue.monthly.toFixed(0)}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                R$ {revenue.perUser.toFixed(2)}/assinante
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pendentes */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Pendentes
                </p>
                <p className="text-2xl font-bold text-amber-600">
                  {totals.pending}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingDown className="h-3 w-3 text-red-500" />
              <span className="text-xs text-red-500 font-medium">
                -{trends.canceledLast30Days}
              </span>
              <span className="text-xs text-muted-foreground">
                cancelados (30d)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Linha 2: Gráficos */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Novos Assinantes por Mês */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Novos Assinantes
            </CardTitle>
            <CardDescription className="text-xs">
              Últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {charts.monthlyNew.map((item, index) => {
                const heightPct = Math.max(
                  (item.count / maxMonthlyCount) * 100,
                  4
                )
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <span className="text-xs font-medium">{item.count}</span>
                    <div
                      className="w-full bg-muted rounded-t-md overflow-hidden"
                      style={{ height: '100px' }}
                    >
                      <div
                        className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-md transition-all duration-700"
                        style={{
                          height: `${heightPct}%`,
                          marginTop: `${100 - heightPct}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {item.month}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <PieChart className="h-4 w-4" />
              Por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {charts.byStatus
                .sort((a, b) => b.count - a.count)
                .map((item, index) => {
                  const pct = (item.count / totalByStatus) * 100
                  const color = STATUS_COLORS[item.status] || '#6b7280'
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span>
                            {STATUS_LABELS[item.status] || item.status}
                          </span>
                        </div>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Linha 3: Distribuição por Plano */}
      {charts.byPlan.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Crown className="h-4 w-4" />
              Distribuição por Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {charts.byPlan.map((plan, index) => {
                const pct =
                  totalByPlan > 0
                    ? ((plan.count / totalByPlan) * 100).toFixed(0)
                    : '0'
                return (
                  <div
                    key={index}
                    className="text-center p-3 bg-muted/50 rounded-lg"
                  >
                    <p className="text-lg font-bold">{plan.count}</p>
                    <p className="text-xs font-medium truncate">
                      {plan.planName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      R$ {plan.price.toFixed(0)}/mês · {pct}%
                    </p>
                  </div>
                )
              })}
              {charts.semPlano > 0 && (
                <div className="text-center p-3 bg-muted/30 rounded-lg border border-dashed">
                  <p className="text-lg font-bold text-muted-foreground">
                    {charts.semPlano}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    Sem Plano
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {totalByPlan > 0
                      ? ((charts.semPlano / totalByPlan) * 100).toFixed(0)
                      : 0}
                    %
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
