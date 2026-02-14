'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Store, ChevronRight, Crown, Zap, ArrowRight, Wallet
} from 'lucide-react'
import { toast } from 'sonner'
import {
  CarouselDestaques, CategoriesList, ParceiroCardGrid,
  SectionHeader, QuickActions, OfertasBanner
} from '@/components/app/home'

// ==========================================
// Tipos
// ==========================================

interface Plan {
  id: string
  name: string
  slug: string | null
  description: string
  price: number
  priceMonthly: number | null
  planBenefits: Array<{ benefit: { id: string; name: string; type: string } }>
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
  user: { name: string; firstName: string; planName: string | null }
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
      planBenefits: Array<{ benefit: { id: string; name: string; type: string } }>
    } | null
  }
  categories: Category[]
  destaques: Destaque[]
  parceirosDestaque: ParceiroDestaque[]
  novidades: ParceiroDestaque[]
  planosDisponiveis?: Plan[]
}

// ==========================================
// Helpers
// ==========================================

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// ==========================================
// Componente Principal
// ==========================================

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

  // ==========================================
  // Loading
  // ==========================================

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-20 rounded-xl flex-shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const isPlanActive =
    data?.assinante?.planId && data?.assinante?.subscriptionStatus === 'ACTIVE'

  // ==========================================
  // Sem plano ativo
  // ==========================================

  if (!isPlanActive) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
          <Crown className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Escolha seu Plano</h1>
        <p className="text-gray-500 mb-8 max-w-sm">
          Assine um plano para ter acesso a descontos exclusivos em centenas de parceiros.
        </p>
        <Button
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl shadow-md shadow-blue-200/40"
          asChild
        >
          <Link href="/app/planos">
            Ver Planos <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>

        {/* Preview de benefícios */}
        <div className="mt-12 grid grid-cols-3 gap-8 text-center">
          {[
            { value: '500+', label: 'Parceiros' },
            { value: '50%', label: 'Desconto max.' },
            { value: '5%', label: 'Cashback' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-2xl font-extrabold text-blue-600">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Planos disponíveis */}
        {data?.planosDisponiveis && data.planosDisponiveis.length > 0 && (
          <div className="mt-10 w-full max-w-md space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Planos disponíveis
            </h2>
            {data.planosDisponiveis
              .filter((p) => Number(p.price) > 0)
              .map((plan, i) => (
                <Link
                  key={plan.id}
                  href={`/checkout/${plan.slug || plan.id}`}
                  className="block"
                >
                  <div
                    className={`flex items-center justify-between p-4 rounded-xl bg-white border transition-all hover:shadow-md ${
                      i === 0
                        ? 'border-blue-200 shadow-sm'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          i === 0
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {i === 0 ? (
                          <Crown className="h-5 w-5" />
                        ) : (
                          <Zap className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {plan.planBenefits.length} benefícios
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <div className="font-bold text-sm text-gray-900">
                          {formatCurrency(plan.price)}
                        </div>
                        <div className="text-[10px] text-gray-400">/mês</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>
    )
  }

  // ==========================================
  // Home com plano ativo
  // ==========================================

  const { user, assinante, categories, destaques, parceirosDestaque, novidades } =
    data!

  return (
    <div className="space-y-6 pb-24">
      {/* Header: saudação + cashback */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Olá,</p>
          <h1 className="text-xl font-bold text-gray-900">{user.firstName}</h1>
        </div>
        <Link href="/app/carteira">
          <div className="flex items-center gap-2.5 bg-white border border-gray-200 px-3.5 py-2 rounded-xl hover:shadow-md hover:border-blue-200 transition-all">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Wallet className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 leading-tight">Cashback</p>
              <p className="font-bold text-sm text-green-600">
                {formatCurrency(assinante.cashback)}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Plano ativo - mini card */}
      <div className="flex items-center gap-3 p-3 bg-white border border-blue-100 rounded-xl">
        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
          <Crown className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400">Plano ativo</p>
          <p className="text-sm font-semibold text-gray-900 truncate">
            {assinante.plan?.name || 'Plano'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          Ativo
        </div>
      </div>

      {/* Carrossel de Destaques */}
      {destaques.length > 0 && <CarouselDestaques destaques={destaques} />}

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

      {/* Ofertas Próximas */}
      <section className="space-y-3">
        <SectionHeader title="Ofertas Próximas" />
        <OfertasBanner />
      </section>

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

      {/* Ações Rápidas */}
      <section className="space-y-3">
        <SectionHeader title="Acesso Rápido" />
        <QuickActions />
      </section>

      {/* Fallback vazio */}
      {!destaques.length && !parceirosDestaque.length && !novidades.length && (
        <div className="text-center py-12">
          <Store className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Nenhum parceiro disponível no momento.</p>
          <p className="text-xs text-gray-300 mt-1">Novos parceiros em breve!</p>
        </div>
      )}
    </div>
  )
}
