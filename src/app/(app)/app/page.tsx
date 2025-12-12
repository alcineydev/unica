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
  AlertCircle,
  Check,
  Crown,
  Calendar,
  Sparkles,
} from 'lucide-react'

import { AppHeader } from '@/components/app'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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

interface Plan {
  id: string
  name: string
  slug: string | null
  description: string
  price: number
  priceMonthly: number | null
  planBenefits: Array<{
    benefit: {
      id: string
      name: string
      type: string
    }
  }>
}

interface HomeData {
  assinante: {
    name: string
    points: number
    cashback: number
    planId: string | null
    planStartDate: string | null
    planEndDate: string | null
    plan: {
      name: string
      planBenefits: Array<{
        benefit: {
          id: string
          name: string
          type: string
        }
      }>
    } | null
  }
  parceiros: Parceiro[]
  totalBeneficios: number
  planosDisponiveis?: Plan[]
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

  function formatDate(dateString: string | null): string {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // Verifica se o plano está ativo
  const hasPlan = data?.assinante?.planId !== null && data?.assinante?.planId !== undefined
  const isPlanActive = hasPlan && data?.assinante?.planEndDate 
    ? new Date(data.assinante.planEndDate) > new Date() 
    : hasPlan

  return (
    <div className="flex flex-col">
      <AppHeader />

      <main className="flex-1 px-4 py-4 space-y-6">
        {/* Banner: Sem plano ativo */}
        {!isLoading && !isPlanActive && (
          <Card className="border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-lg text-gray-800">Você ainda não tem um plano ativo</CardTitle>
              </div>
              <CardDescription>
                Escolha um plano e comece a aproveitar todos os benefícios do clube
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="bg-gray-900 hover:bg-gray-800">
                <Link href="/planos">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ver planos disponíveis
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Cards de Saldo - Apenas se tem plano ativo */}
        {isPlanActive && (
          <div className="grid grid-cols-2 gap-3">
            <Link href="/app/carteira">
              <Card className="bg-gradient-to-br from-gray-700 to-gray-900 text-white border-0">
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
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
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
        )}

        {/* Plano Atual (se tiver) */}
        {isPlanActive && data?.assinante.plan && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-gray-700" />
                  <div>
                    <p className="text-sm text-muted-foreground">Seu plano</p>
                    <p className="text-lg font-bold">{data.assinante.plan.name}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Ativo
                </Badge>
              </div>
              
              {data.assinante.planEndDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4" />
                  <span>Válido até {formatDate(data.assinante.planEndDate)}</span>
                </div>
              )}

              {/* Benefícios do plano */}
              {data.assinante.plan.planBenefits && data.assinante.plan.planBenefits.length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm font-medium mb-2">Seus benefícios:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {data.assinante.plan.planBenefits.slice(0, 4).map((pb) => (
                      <div key={pb.benefit.id} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="truncate">{pb.benefit.name}</span>
                      </div>
                    ))}
                  </div>
                  {data.assinante.plan.planBenefits.length > 4 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      +{data.assinante.plan.planBenefits.length - 4} benefícios
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Planos Disponíveis (se não tiver plano ativo) */}
        {!isLoading && !isPlanActive && data?.planosDisponiveis && data.planosDisponiveis.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3">Escolha seu plano</h2>
            <div className="space-y-3">
              {data.planosDisponiveis.map((plan, index) => (
                <Card 
                  key={plan.id} 
                  className={index === 1 ? 'border-gray-900 border-2' : ''}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{plan.name}</h3>
                          {index === 1 && (
                            <Badge className="bg-gray-900 text-white text-xs">Popular</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(plan.priceMonthly || plan.price)}
                        </p>
                        <p className="text-xs text-muted-foreground">/mês</p>
                      </div>
                    </div>
                    
                    {/* Benefícios resumidos */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {plan.planBenefits.slice(0, 3).map((pb) => (
                        <Badge key={pb.benefit.id} variant="outline" className="text-xs">
                          {pb.benefit.name}
                        </Badge>
                      ))}
                      {plan.planBenefits.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{plan.planBenefits.length - 3}
                        </Badge>
                      )}
                    </div>

                    {plan.slug && (
                      <Button asChild className="w-full bg-gray-900 hover:bg-gray-800">
                        <Link href={`/checkout/${plan.slug}`}>
                          Assinar agora
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Parceiros em Destaque - Apenas se tem plano ativo */}
        {isPlanActive && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Parceiros</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/app/parceiros" className="text-gray-700">
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
                          <div className="rounded-full bg-gray-100 p-3">
                            <Store className="h-5 w-5 text-gray-700" />
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
                    Nenhum parceiro disponível na sua cidade
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
