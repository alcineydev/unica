'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Coins,
  Gift,
  ArrowRight,
  Store,
  Percent,
  MapPin,
} from 'lucide-react'

import { AppHeader } from '@/components/app'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Parceiro {
  id: string
  companyName: string
  tradeName: string
  category: string
  description: string
  city: {
    name: string
  }
}

interface HomeData {
  assinante: {
    name: string
    points: number
    cashback: number
    plan: {
      name: string
    }
  }
  parceiros: Parceiro[]
  totalBeneficios: number
}

export default function AppHomePage() {
  const [data, setData] = useState<HomeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchHome = useCallback(async () => {
    try {
      const response = await fetch('/api/app/home')
      const result = await response.json()
      if (response.ok) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar home:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHome()
  }, [fetchHome])

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="flex flex-col">
      <AppHeader />

      <main className="flex-1 px-4 py-4 space-y-6">
        {/* Cards de Saldo */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/app/carteira">
            <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-5 w-5" />
                  <span className="text-sm font-medium opacity-90">Pontos</span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-20 bg-white/20" />
                ) : (
                  <p className="text-2xl font-bold">
                    {data?.assinante.points.toFixed(0) || 0}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/app/carteira">
            <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-5 w-5" />
                  <span className="text-sm font-medium opacity-90">Cashback</span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 bg-white/20" />
                ) : (
                  <p className="text-2xl font-bold">
                    {formatCurrency(data?.assinante.cashback || 0)}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Plano e Beneficios */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Seu plano</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-24 mt-1" />
                ) : (
                  <p className="text-lg font-bold">{data?.assinante.plan.name}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Beneficios ativos</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-8 mt-1 ml-auto" />
                ) : (
                  <p className="text-lg font-bold text-primary">{data?.totalBeneficios}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parceiros em Destaque */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Parceiros</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/parceiros" className="text-primary">
                Ver todos
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : data?.parceiros && data.parceiros.length > 0 ? (
            <div className="space-y-3">
              {data.parceiros.slice(0, 5).map((parceiro) => (
                <Link key={parceiro.id} href={`/app/parceiros/${parceiro.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-3">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">
                              {parceiro.tradeName || parceiro.companyName}
                            </p>
                            <Badge variant="outline" className="shrink-0 text-xs">
                              <Percent className="h-3 w-3 mr-1" />
                              Desconto
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {parceiro.category}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            {parceiro.city.name}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Store className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Nenhum parceiro disponivel na sua cidade
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

