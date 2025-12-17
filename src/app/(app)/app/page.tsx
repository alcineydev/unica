'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  QrCode,
  Gift,
  Store,
  Wallet,
  TrendingUp,
  ChevronRight,
  Crown,
  Star,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { AppHeader } from '@/components/app'

interface Parceiro {
  id: string
  companyName: string
  tradeName: string | null
  category: string
  description: string | null
  logo: string | null
  city: { name: string } | null
  benefits?: Array<{
    id: string
    name: string
    type: string
    value: number
  }>
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
    subscriptionStatus: string
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

export default function AssinanteDashboard() {
  const [data, setData] = useState<HomeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/app/home')
      const result = await response.json()
      
      if (result.error) {
        toast.error(result.error)
        return
      }
      
      setData(result.data)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
      toast.error('Erro ao carregar dados')
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

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="space-y-6 p-4">
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-16 w-16 rounded-full bg-white/20" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40 bg-white/20" />
                <Skeleton className="h-4 w-24 bg-white/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 rounded-xl bg-white/10" />
              <Skeleton className="h-20 rounded-xl bg-white/10" />
            </div>
          </div>
          <Skeleton className="h-20 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  // Verifica se tem plano ativo
  const isPlanActive = data?.assinante?.planId && data?.assinante?.subscriptionStatus === 'ACTIVE'

  // Sem plano ativo - Tela de escolha de plano
  if (!isPlanActive) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Crown className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Escolha seu Plano</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            Assine um plano para ter acesso a descontos exclusivos em centenas de parceiros.
          </p>
          <Link href="/checkout?plano=">
            <Button size="lg" className="px-8" asChild>
              <Link href="/app/planos">
                Ver Planos Disponíveis
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </Link>

          {/* Preview de benefícios */}
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Parceiros</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">50%</div>
              <div className="text-sm text-muted-foreground">Desconto máx.</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">5%</div>
              <div className="text-sm text-muted-foreground">Cashback</div>
            </div>
          </div>

          {/* Planos disponíveis */}
          {data?.planosDisponiveis && data.planosDisponiveis.length > 0 && (
            <div className="mt-12 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Planos Disponíveis</h2>
              <div className="space-y-3">
                {data.planosDisponiveis.map((plan, index) => (
                  <Card 
                    key={plan.id} 
                    className={index === 0 ? 'border-primary border-2' : ''}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}>
                            {index === 0 ? <Crown className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                          </div>
                          <div>
                            <h3 className="font-semibold">{plan.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {plan.planBenefits.length} benefícios
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(plan.price)}</div>
                          <div className="text-xs text-muted-foreground">/mês</div>
                        </div>
                      </div>
                      <Button 
                        className="w-full mt-3" 
                        variant={index === 0 ? 'default' : 'outline'}
                        asChild
                      >
                        <Link href={`/checkout?plano=${plan.id}`}>
                          Assinar
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const { assinante, parceiros, totalBeneficios } = data!

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="space-y-6 p-4 pb-24">
        {/* Header com perfil */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white/20">
              <AvatarFallback className="bg-white/20 text-white text-xl">
                {assinante.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Olá, {assinante.name?.split(' ')[0] || 'Assinante'}!</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  <Crown className="h-3 w-3 mr-1" />
                  {assinante.plan?.name || 'Plano Ativo'}
                </Badge>
              </div>
            </div>
            <Link href="/app/perfil">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Cards de resumo */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Star className="h-4 w-4" />
                Pontos
              </div>
              <div className="text-2xl font-bold">{assinante.points || 0}</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Wallet className="h-4 w-4" />
                Cashback
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(assinante.cashback || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Card */}
        <Card className="border-2 border-dashed">
          <CardContent className="p-4">
            <Link href="/app/carteira" className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                  <QrCode className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Minha Carteirinha</h3>
                  <p className="text-sm text-muted-foreground">
                    Apresente seu QR Code nos parceiros
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Gift className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalBeneficios}</div>
                <div className="text-xs text-muted-foreground">Benefícios</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{parceiros.length}</div>
                <div className="text-xs text-muted-foreground">Parceiros</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefícios do plano */}
        {assinante.plan?.planBenefits && assinante.plan.planBenefits.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Seus Benefícios
              </h3>
              <div className="flex flex-wrap gap-2">
                {assinante.plan.planBenefits.slice(0, 5).map((pb) => (
                  <Badge key={pb.benefit.id} variant="secondary">
                    {pb.benefit.name}
                  </Badge>
                ))}
                {assinante.plan.planBenefits.length > 5 && (
                  <Badge variant="outline">
                    +{assinante.plan.planBenefits.length - 5} mais
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parceiros em destaque */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Parceiros em Destaque</h2>
            <Link href="/app/parceiros" className="text-sm text-primary flex items-center">
              Ver todos
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {parceiros.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhum parceiro disponível ainda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {parceiros.slice(0, 5).map((parceiro) => (
                <Link key={parceiro.id} href={`/app/parceiros/${parceiro.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="h-12 w-12 rounded-xl">
                        <AvatarImage src={parceiro.logo || undefined} />
                        <AvatarFallback className="rounded-xl bg-primary/10">
                          {(parceiro.tradeName || parceiro.companyName)?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                          {parceiro.tradeName || parceiro.companyName}
                        </h3>
                        {parceiro.category && (
                          <p className="text-sm text-muted-foreground">{parceiro.category}</p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {parceiro.benefits?.length || 0} {(parceiro.benefits?.length || 0) === 1 ? 'benefício' : 'benefícios'}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
