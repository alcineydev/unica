'use client'

import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, PieChart, Activity, TrendingUp } from 'lucide-react'

interface TimelineItem {
  month: string
  total: number
  count: number
}

interface TypeItem {
  type: string
  count: number
  total: number
}

interface Stats {
  totalTransactions?: number
  totalSpent?: number
  totalCashback?: number
  totalPointsUsed?: number
  totalDiscounts?: number
}

interface ActivityTabProps {
  assinante: Record<string, unknown>
  charts: {
    timeline: TimelineItem[]
    byType: TypeItem[]
  }
  stats: Stats
}

const TYPE_LABELS: Record<string, string> = {
  PURCHASE: 'Compras',
  CASHBACK: 'Cashback',
  BONUS: 'Bônus',
  MONTHLY_POINTS: 'Pontos Mensais',
  REFUND: 'Estornos',
}

const TYPE_COLORS: Record<string, string> = {
  PURCHASE: '#3b82f6',
  CASHBACK: '#10b981',
  BONUS: '#8b5cf6',
  MONTHLY_POINTS: '#f59e0b',
  REFUND: '#ef4444',
}

export default function SubscriberActivityTab({
  assinante,
  charts,
  stats,
}: ActivityTabProps) {
  const timeline = charts?.timeline || []
  const byType = charts?.byType || []

  const maxTimelineValue = useMemo(() => {
    return Math.max(...timeline.map((t) => t.total), 1)
  }, [timeline])

  const totalByTypeCount = useMemo(() => {
    return byType.reduce((sum, t) => sum + t.count, 0) || 1
  }, [byType])

  const user = assinante.user as Record<string, unknown> | undefined
  const _count = assinante._count as Record<string, number> | undefined
  const memberSince = new Date(
    (user?.createdAt as string) || (assinante.createdAt as string)
  )
  const daysMember = Math.floor(
    (Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24)
  )
  const monthsMember = Math.floor(daysMember / 30)

  return (
    <div className="space-y-6">
      {/* Resumo de Atividade */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Activity className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-bold">
              {stats?.totalTransactions || 0}
            </p>
            <p className="text-xs text-muted-foreground">Total Transações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold">
              R$ {(stats?.totalSpent || 0).toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Movimentado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <BarChart3 className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <p className="text-2xl font-bold">{monthsMember}</p>
            <p className="text-xs text-muted-foreground">Meses de Membro</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <PieChart className="h-5 w-5 mx-auto mb-1 text-orange-600" />
            <p className="text-2xl font-bold">{_count?.avaliacoes || 0}</p>
            <p className="text-xs text-muted-foreground">Avaliações</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Timeline - Barras CSS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Movimentação Mensal
          </CardTitle>
          <CardDescription>Últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Sem dados de movimentação</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeline.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.month}</span>
                    <span className="font-medium">
                      R$ {item.total.toFixed(2)} ({item.count} trans.)
                    </span>
                  </div>
                  <div className="h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.max((item.total / maxTimelineValue) * 100, 2)}%`,
                      }}
                    >
                      {item.total > 0 && (
                        <span className="text-[10px] text-white font-medium">
                          {((item.total / maxTimelineValue) * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribuição por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="h-4 w-4" />
            Distribuição por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {byType.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Sem dados de transações</p>
            </div>
          ) : (
            <div className="space-y-3">
              {byType.map((item, index) => {
                const percentage = (item.count / totalByTypeCount) * 100
                const color = TYPE_COLORS[item.type] || '#6b7280'

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span>
                          {TYPE_LABELS[item.type] || item.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {item.count}x
                        </Badge>
                        <span className="font-medium w-24 text-right">
                          R$ {item.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info de Membro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Membro desde</span>
            <span>{memberSince.toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tempo como membro</span>
            <span>
              {daysMember} dias ({monthsMember} meses)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">QR Code</span>
            <code className="text-xs bg-muted px-2 py-0.5 rounded">
              {assinante.qrCode as string}
            </code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID do Assinante</span>
            <code className="text-xs bg-muted px-2 py-0.5 rounded">
              {assinante.id as string}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
