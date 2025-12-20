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
  ArrowRight,
  Loader2,
  TrendingDown
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Bem-vindo, {session?.user?.name}!
          </p>
        </div>
        <Link href="/parceiro/vendas">
          <Button className="w-full sm:w-auto">
            <QrCode className="mr-2 h-4 w-4" />
            Registrar Venda
          </Button>
        </Link>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Vendas do Mês */}
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                  Vendas do Mês
                </p>
                <p className="text-lg md:text-3xl font-bold mt-0.5">
                  {data?.totalSales ?? 0}
                </p>
                {data?.salesGrowth !== undefined && (
                  <div className={cn(
                    "flex items-center gap-1 mt-0.5 text-[10px] md:text-xs",
                    data.salesGrowth >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {data.salesGrowth >= 0 ? (
                      <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    )}
                    <span>{data.salesGrowth}%</span>
                  </div>
                )}
              </div>
              <div className="p-1.5 md:p-3 rounded-lg md:rounded-full bg-blue-100 flex-shrink-0">
                <ShoppingCart className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faturamento */}
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                  Faturamento
                </p>
                <p className="text-lg md:text-3xl font-bold mt-0.5">
                  {formatCurrency(data?.salesAmount ?? 0)}
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                  Este mês
                </p>
              </div>
              <div className="p-1.5 md:p-3 rounded-lg md:rounded-full bg-green-100 flex-shrink-0">
                <DollarSign className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visualizações */}
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                  Visualizações
                </p>
                <p className="text-lg md:text-3xl font-bold mt-0.5">
                  {data?.pageViews ?? 0}
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                  Perfil da empresa
                </p>
              </div>
              <div className="p-1.5 md:p-3 rounded-lg md:rounded-full bg-purple-100 flex-shrink-0">
                <Eye className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avaliações */}
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                  Avaliações
                </p>
                <p className="text-lg md:text-3xl font-bold mt-0.5">
                  {data?.avaliacoes?.media ?? 0}
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                  {data?.avaliacoes?.total ?? 0} avaliações
                </p>
              </div>
              <div className="p-1.5 md:p-3 rounded-lg md:rounded-full bg-yellow-100 flex-shrink-0">
                <Star className="h-4 w-4 md:h-6 md:w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendas Recentes e Ações */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-5">
        {/* Vendas Recentes */}
        <Card className="lg:col-span-3">
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg">Vendas Recentes</CardTitle>
                <CardDescription>Últimas transações realizadas</CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {data?.recentTransactions && data.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {data.recentTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{tx.assinante.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </p>
                    </div>
                    <span className="font-semibold text-green-600 flex-shrink-0 ml-2">
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma venda ainda</p>
                <Link href="/parceiro/vendas">
                  <Button variant="link" className="mt-2">
                    Registrar primeira venda
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 space-y-3">
            <Link href="/parceiro/vendas" className="block">
              <Button className="w-full justify-start h-auto py-3" variant="default">
                <QrCode className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Escanear QR Code</p>
                  <p className="text-xs opacity-80">Registrar venda com QR do cliente</p>
                </div>
              </Button>
            </Link>
            
            <Link href="/parceiro/saldo" className="block">
              <Button className="w-full justify-start h-auto py-3" variant="outline">
                <DollarSign className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Ver Saldo</p>
                  <p className="text-xs text-muted-foreground">Consultar créditos acumulados</p>
                </div>
              </Button>
            </Link>
            
            <Link href="/parceiro/perfil" className="block">
              <Button className="w-full justify-start h-auto py-3" variant="outline">
                <TrendingUp className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Minha Empresa</p>
                  <p className="text-xs text-muted-foreground">Atualizar informações</p>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
