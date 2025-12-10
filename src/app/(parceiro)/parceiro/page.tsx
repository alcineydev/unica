'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  TrendingUp, 
  Eye, 
  MessageCircle, 
  ShoppingCart,
  DollarSign,
  QrCode,
  ArrowUpRight,
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardData {
  totalSales: number
  salesAmount: number
  pageViews: number
  whatsappClicks: number
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

  const stats = [
    {
      title: 'Vendas do Mes',
      value: data?.totalSales ?? 0,
      icon: ShoppingCart,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Faturamento',
      value: formatCurrency(data?.salesAmount ?? 0),
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Visualizacoes',
      value: data?.pageViews ?? 0,
      icon: Eye,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Cliques WhatsApp',
      value: data?.whatsappClicks ?? 0,
      icon: MessageCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho da sua empresa
          </p>
        </div>
        <Button size="lg" asChild>
          <Link href="/parceiro/venda">
            <QrCode className="mr-2 h-5 w-5" />
            Registrar Venda
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{stat.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Vendas Recentes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ultimas transacoes realizadas
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            ) : data?.recentTransactions && data.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {data.recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{tx.assinante.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingCart className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhuma venda ainda</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/parceiro/venda">
                    Registrar primeira venda
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acoes Rapidas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Acesse as principais funcionalidades
            </p>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <Link href="/parceiro/venda">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <QrCode className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Escanear QR Code</p>
                    <p className="text-xs text-muted-foreground">
                      Registrar venda com QR do cliente
                    </p>
                  </div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <Link href="/parceiro/saldo">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-500/10 p-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Ver Saldo</p>
                    <p className="text-xs text-muted-foreground">
                      Consultar creditos acumulados
                    </p>
                  </div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <Link href="/parceiro/perfil">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-purple-500/10 p-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Minha Empresa</p>
                    <p className="text-xs text-muted-foreground">
                      Atualizar informacoes
                    </p>
                  </div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

