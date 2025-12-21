'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Store,
  ChevronRight,
  Crown,
  Zap,
  ArrowRight,
  Wallet
} from 'lucide-react'
import { toast } from 'sonner'
import { CarouselDestaques, CategoriesList, ParceiroCardGrid, SectionHeader } from '@/components/app/home'

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

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  banner: string
}

interface Destaque {
  id: string
  nomeFantasia: string
  bannerDestaque: string | null
  logo: string | null
}

interface ParceiroDestaque {
  id: string
  nomeFantasia: string
  logo: string | null
  category: string
  city: { name: string } | null
  categoryRef: { name: string } | null
  rating: number
  totalAvaliacoes: number
  desconto: string | null
}

interface HomeData {
  user: {
    name: string
    firstName: string
    planName: string | null
  }
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
  categories: Category[]
  destaques: Destaque[]
  parceirosDestaque: ParceiroDestaque[]
  novidades: ParceiroDestaque[]
  planosDisponiveis?: Plan[]
}

export default function AppHomePage() {
  const [data, setData] = useState<HomeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchHomeData()
  }, [])

  const fetchHomeData = async () => {
    try {
      const response = await fetch('/api/app/home')
      const result = await response.json()

      if (result.error) {
        toast.error(result.error)
        return
      }

      setData(result.data)
    } catch (error) {
      console.error('Erro ao carregar home:', error)
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-20 rounded-xl flex-shrink-0" />
          ))}
        </div>
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // Verifica se tem plano ativo
  const isPlanActive = data?.assinante?.planId && data?.assinante?.subscriptionStatus === 'ACTIVE'

  // Sem plano ativo - Tela de escolha de plano
  if (!isPlanActive) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Crown className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Escolha seu Plano</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          Assine um plano para ter acesso a descontos exclusivos em centenas de parceiros.
        </p>
        <Button size="lg" className="px-8" asChild>
          <Link href="/app/planos">
            Ver Planos Disponíveis
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>

        {/* Preview de benefícios */}
        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-primary">500+</div>
            <div className="text-sm text-muted-foreground">Parceiros</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">50%</div>
            <div className="text-sm text-muted-foreground">Desconto max.</div>
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
    )
  }

  // Home com plano ativo
  const { user, assinante, categories, destaques, parceirosDestaque, novidades } = data!

  return (
    <div className="space-y-6 pb-24">
      {/* Header com saudação e cashback */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Olá,</p>
          <h1 className="text-xl font-bold">{user.firstName}</h1>
        </div>
        <Link href="/app/carteira">
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors">
            <Wallet className="h-4 w-4" />
            <div className="text-right">
              <p className="text-[10px] leading-tight">Cashback</p>
              <p className="font-bold text-sm">
                {formatCurrency(assinante.cashback)}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Carrossel de Destaques */}
      {destaques.length > 0 && (
        <CarouselDestaques destaques={destaques} />
      )}

      {/* Categorias */}
      {categories.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Categorias" href="/app/parceiros" />
          <CategoriesList categories={categories} />
        </section>
      )}

      {/* Parceiros em Destaque */}
      {parceirosDestaque.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Em Destaque" href="/app/parceiros?destaque=true" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {parceirosDestaque.slice(0, 6).map((parceiro) => (
              <ParceiroCardGrid key={parceiro.id} parceiro={parceiro} />
            ))}
          </div>
        </section>
      )}

      {/* Novidades */}
      {novidades.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Novidades" href="/app/parceiros?novidades=true" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {novidades.slice(0, 6).map((parceiro) => (
              <ParceiroCardGrid key={parceiro.id} parceiro={parceiro} />
            ))}
          </div>
        </section>
      )}

      {/* Se não houver nenhum conteúdo */}
      {!destaques.length && !parceirosDestaque.length && !novidades.length && (
        <div className="text-center py-12">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Nenhum parceiro disponível no momento.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Novos parceiros em breve!
          </p>
        </div>
      )}
    </div>
  )
}
