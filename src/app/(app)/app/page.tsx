'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppHeader } from '@/components/app/app-header'
import {
  CreditCard,
  Percent,
  Gift,
  Star,
  ArrowRight,
  MapPin,
  Sparkles,
  TrendingUp,
  Crown,
  ChevronRight,
  Loader2,
  Wallet
} from 'lucide-react'
import { toast } from 'sonner'

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

interface Plan {
  id: string
  name: string
  description: string
  price: number
  planBenefits: Array<{
    benefit: {
      id: string
      name: string
      type: string
    }
  }>
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

// Ícones das categorias
const categoryIcons: Record<string, string> = {
  'alimentacao': '🍔',
  'saude': '💊',
  'beleza': '💅',
  'fitness': '💪',
  'educacao': '📚',
  'servicos': '🔧',
  'lazer': '🎮',
  'pets': '🐾',
  'moda': '👗',
  'tecnologia': '💻',
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
      <div className="min-h-screen">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto mb-4" />
            <p className="text-slate-500">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  // Verifica se tem plano ativo
  const isPlanActive = data?.assinante?.planId && data?.assinante?.subscriptionStatus === 'ACTIVE'

  // Sem plano ativo - Tela de escolha de plano
  if (!isPlanActive) {
    return (
      <div className="min-h-screen">
        <AppHeader showLocation={false} />
        <div className="px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="h-10 w-10 text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Escolha seu Plano</h1>
            <p className="text-slate-500 mb-8">
              Assine um plano para ter acesso a descontos exclusivos em centenas de parceiros.
            </p>

            {/* Stats Preview */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="text-2xl font-bold text-brand-600">500+</div>
                <div className="text-xs text-slate-500">Parceiros</div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="text-2xl font-bold text-brand-600">50%</div>
                <div className="text-xs text-slate-500">Desconto máx.</div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="text-2xl font-bold text-brand-600">5%</div>
                <div className="text-xs text-slate-500">Cashback</div>
              </div>
            </div>

            {/* Planos */}
            {data?.planosDisponiveis && data.planosDisponiveis.length > 0 && (
              <div className="space-y-4">
                {data.planosDisponiveis.map((plan, index) => (
                  <Link
                    key={plan.id}
                    href={`/checkout?plano=${plan.id}`}
                    className={`block p-4 bg-white rounded-2xl shadow-sm border-2 transition-all ${
                      index === 0 ? 'border-brand-500' : 'border-slate-100 hover:border-brand-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          index === 0 ? 'bg-brand-600' : 'bg-slate-100'
                        }`}>
                          <Crown className={`h-6 w-6 ${index === 0 ? 'text-white' : 'text-slate-600'}`} />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                          <p className="text-sm text-slate-500">{plan.planBenefits.length} benefícios</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900">{formatCurrency(plan.price)}</div>
                        <div className="text-xs text-slate-500">/mês</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <Link
              href="/app/planos"
              className="inline-flex items-center gap-2 mt-6 text-brand-600 font-medium"
            >
              Ver todos os planos
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Home com plano ativo
  const { user, assinante, categories, destaques, parceirosDestaque, novidades } = data!

  return (
    <div className="min-h-screen">
      <AppHeader />

      <div className="px-4 py-6 space-y-6">
        {/* Banner de Boas-vindas / Plano */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-3xl p-6 text-white relative overflow-hidden">
          {/* Decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium text-brand-100">Seu Plano</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">
              {assinante?.plan?.name || 'Plano Básico'}
            </h2>
            <p className="text-brand-100 text-sm mb-4">
              {assinante?.plan?.planBenefits?.length || 0} benefícios disponíveis
            </p>
            <div className="flex gap-3">
              <Link
                href="/app/carteirinha"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-brand-600 rounded-xl text-sm font-semibold hover:bg-brand-50 transition-all"
              >
                <CreditCard className="w-4 h-4" />
                Carteirinha
              </Link>
              <Link
                href="/app/carteira"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl text-sm font-semibold hover:bg-white/30 transition-all"
              >
                <Wallet className="w-4 h-4" />
                {formatCurrency(assinante.cashback)}
              </Link>
            </div>
          </div>
        </div>

        {/* Parceiros em Destaque - Slider Horizontal */}
        {parceirosDestaque.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                Parceiros em Destaque
              </h2>
              <Link href="/app/parceiros?destaque=true" className="text-sm text-brand-600 font-medium flex items-center gap-1">
                Ver todos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Slider Horizontal */}
            <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
              <div className="flex gap-4" style={{ width: 'max-content' }}>
                {parceirosDestaque.map((parceiro) => (
                  <Link
                    key={parceiro.id}
                    href={`/app/parceiros/${parceiro.id}`}
                    className="w-44 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md hover:border-brand-200 transition-all flex-shrink-0"
                  >
                    {/* Imagem/Logo */}
                    <div className="h-28 bg-slate-100 relative">
                      {parceiro.logo ? (
                        <img
                          src={parceiro.logo}
                          alt={parceiro.nomeFantasia}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                          <span className="text-4xl font-bold text-slate-300">
                            {parceiro.nomeFantasia?.charAt(0)}
                          </span>
                        </div>
                      )}
                      {/* Badge de desconto */}
                      {parceiro.desconto && (
                        <span className="absolute top-2 right-2 px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-sm">
                          {parceiro.desconto}
                        </span>
                      )}
                      {/* Estrela de destaque */}
                      <div className="absolute top-2 left-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                        <Star className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">
                        {parceiro.nomeFantasia}
                      </h3>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {parceiro.categoryRef?.name || parceiro.category || 'Parceiro'}
                      </p>
                      {parceiro.city && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{parceiro.city.name}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Ações Rápidas */}
        <div className="grid grid-cols-4 gap-3">
          <Link href="/app/parceiros" className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
              <Percent className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-slate-700 text-center">Descontos</span>
          </Link>
          <Link href="/app/beneficios" className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-2">
              <Gift className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-slate-700 text-center">Benefícios</span>
          </Link>
          <Link href="/app/carteirinha" className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-2">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-slate-700 text-center">Carteirinha</span>
          </Link>
          <Link href="/app/carteira" className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-slate-700 text-center">Cashback</span>
          </Link>
        </div>

        {/* Categorias */}
        {categories.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Categorias</h2>
              <Link href="/app/parceiros" className="text-sm text-brand-600 font-medium flex items-center gap-1">
                Ver todas
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {categories.slice(0, 8).map((categoria) => (
                <Link
                  key={categoria.id}
                  href={`/app/parceiros?categoria=${categoria.slug}`}
                  className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-brand-200 transition-all"
                >
                  <span className="text-2xl mb-1">
                    {categoryIcons[categoria.slug] || '📦'}
                  </span>
                  <span className="text-xs font-medium text-slate-700 text-center line-clamp-1">
                    {categoria.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Parceiros em Destaque */}
        {parceirosDestaque.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Em Destaque</h2>
              <Link href="/app/parceiros?destaque=true" className="text-sm text-brand-600 font-medium flex items-center gap-1">
                Ver todos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {parceirosDestaque.slice(0, 5).map((parceiro) => (
                <Link
                  key={parceiro.id}
                  href={`/app/parceiros/${parceiro.id}`}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {parceiro.logo ? (
                      <img src={parceiro.logo} alt="" className="w-16 h-16 object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-slate-300">
                        {parceiro.nomeFantasia?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 truncate">{parceiro.nomeFantasia}</h3>
                      {parceiro.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm text-slate-600">{parceiro.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{parceiro.categoryRef?.name || parceiro.category}</p>
                    {parceiro.desconto && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                        {parceiro.desconto}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Parceiros Próximos */}
        {parceirosDestaque.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Perto de Você</h2>
              <Link href="/app/parceiros?ordenar=distancia" className="text-sm text-brand-600 font-medium flex items-center gap-1">
                Ver mapa
                <MapPin className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="flex gap-3" style={{ width: 'max-content' }}>
                {parceirosDestaque.slice(0, 6).map((parceiro) => (
                  <Link
                    key={parceiro.id}
                    href={`/app/parceiros/${parceiro.id}`}
                    className="w-40 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all flex-shrink-0"
                  >
                    <div className="h-24 bg-slate-100 relative">
                      {parceiro.logo ? (
                        <img src={parceiro.logo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl font-bold text-slate-300">
                            {parceiro.nomeFantasia?.charAt(0)}
                          </span>
                        </div>
                      )}
                      {parceiro.desconto && (
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                          {parceiro.desconto}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">{parceiro.nomeFantasia}</h3>
                      <p className="text-xs text-slate-500 truncate">{parceiro.categoryRef?.name || parceiro.category}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Novidades */}
        {novidades.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Novidades</h2>
              <Link href="/app/parceiros?novidades=true" className="text-sm text-brand-600 font-medium flex items-center gap-1">
                Ver todas
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {novidades.slice(0, 4).map((parceiro) => (
                <Link
                  key={parceiro.id}
                  href={`/app/parceiros/${parceiro.id}`}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="h-28 bg-slate-100 relative">
                    {parceiro.logo ? (
                      <img src={parceiro.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl font-bold text-slate-300">
                          {parceiro.nomeFantasia?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
                      Novo
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-slate-900 text-sm truncate">{parceiro.nomeFantasia}</h3>
                    <p className="text-xs text-slate-500 truncate">{parceiro.categoryRef?.name || parceiro.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
