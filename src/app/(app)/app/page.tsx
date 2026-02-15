'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Store, ChevronRight, Crown, Zap, ArrowRight, Wallet,
  Eye, EyeOff, Coins, TrendingUp, Sparkles, Star,
  Building2
} from 'lucide-react'
import { toast } from 'sonner'
import { CarouselDestaques, RecentTransactions } from '@/components/app/home'
import { NotificationBell } from '@/components/app/notification-bell'
import { MobileMenu } from '@/components/app/mobile-menu'

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

interface ParceiroPlano {
  id: string
  companyName: string
  tradeName: string | null
  logo: string | null
  category: string
  description: string | null
  city: { name: string } | null
  avaliacoes: { media: number; total: number }
  benefits: Array<{ id: string; name: string; type: string; value: number }>
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
  user: { name: string; firstName: string; planName: string | null; avatar: string | null }
  assinante: {
    name: string; points: number; cashback: number
    planId: string | null; subscriptionStatus: string
    planStartDate: string | null; planEndDate: string | null
    plan: { name: string; planBenefits: Array<{ benefit: { id: string; name: string; type: string } }> } | null
  }
  categories: Category[]
  destaques: Destaque[]
  parceirosDestaque: ParceiroDestaque[]
  novidades: ParceiroDestaque[]
  parceiros: ParceiroPlano[]
  currentPlanId: string | null
  planosDisponiveis?: Plan[]
}

// ==========================================
// Helpers
// ==========================================

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function getBenefitBadge(type: string, value: number) {
  switch (type) {
    case 'DESCONTO': return { text: `${value}% OFF`, color: 'bg-green-100 text-green-700' }
    case 'CASHBACK': return { text: `${value}% Cash`, color: 'bg-amber-100 text-amber-700' }
    case 'PONTOS': return { text: `${value} pts`, color: 'bg-blue-100 text-blue-700' }
    default: return { text: 'Exclusivo', color: 'bg-violet-100 text-violet-700' }
  }
}

// ==========================================
// Componente
// ==========================================

export default function AppHomePage() {
  const [data, setData] = useState<HomeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showValues, setShowValues] = useState(true)

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

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-0">
        <Skeleton className="h-[240px] rounded-none" />
        <div className="px-4 sm:px-6 lg:px-10 space-y-4 mt-4">
          <Skeleton className="h-40 rounded-2xl" />
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-20 w-20 rounded-xl flex-shrink-0" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const isPlanActive = data?.assinante?.planId && data?.assinante?.subscriptionStatus === 'ACTIVE'

  // ===== SEM PLANO ATIVO =====
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

        {data?.planosDisponiveis && data.planosDisponiveis.length > 0 && (
          <div className="mt-10 w-full max-w-md space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Planos disponíveis</h2>
            {data.planosDisponiveis.filter(p => Number(p.price) > 0).map((plan, i) => (
              <Link key={plan.id} href="/app/planos" className="block">
                <div className={`flex items-center justify-between p-4 rounded-xl bg-white border transition-all hover:shadow-md ${
                  i === 0 ? 'border-blue-200 shadow-sm' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {i === 0 ? <Crown className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-400">{plan.planBenefits.length} benefícios</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <div className="font-bold text-sm text-gray-900">{formatCurrency(plan.price)}</div>
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

  // ===== HOME COM PLANO ATIVO =====
  const {
    user, assinante, categories, destaques,
    parceirosDestaque, parceiros, planosDisponiveis, currentPlanId
  } = data!

  // Planos de upgrade (excluir plano atual, só preço maior)
  const isConvite = assinante.plan?.name?.toLowerCase() === 'convite'
  const currentPlanPrice = planosDisponiveis?.find(p => p.id === currentPlanId)?.price || 0
  const planosUpgrade = isConvite ? [] : (planosDisponiveis?.filter(p =>
    p.id !== currentPlanId && Number(p.price) > Number(currentPlanPrice) && Number(p.price) > 0
  ) || [])

  return (
    <div className="space-y-0 pb-24">

      {/* ╔══════════════════════════════════════╗ */}
      {/* ║     HERO — DARK MOBILE / LIGHT DK    ║ */}
      {/* ╚══════════════════════════════════════╝ */}

      {/* ========== MOBILE HERO (DARK) ========== */}
      <div className="lg:hidden relative">
        <div className="bg-gradient-to-br from-[#0a1628] via-[#0f1f3d] to-[#0a1628]">
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/[0.08] rounded-full blur-[100px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-400/[0.06] rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

          <div className="relative px-5 pt-4 pb-7">
            {/* Mini header: foto+nome+plano | sino */}
            <div className="flex items-center justify-between mb-5">
              <Link href="/app/perfil" className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                  {user.avatar ? (
                    <Image src={user.avatar} alt={user.firstName} width={40} height={40} className="object-cover w-full h-full" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                      <span className="text-white/70 font-semibold text-sm">{user.firstName?.charAt(0)?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold text-[14px]">Olá, {user.firstName}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Crown className="h-3 w-3 text-amber-400/60" />
                    <span className="text-[10px] text-white/40">{assinante.plan?.name || 'Plano'}</span>
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-1">
                <NotificationBell variant="dark" />
                <MobileMenu variant="dark" />
              </div>
            </div>

            {/* Saldo + Toggle */}
            <div className="mb-5">
              <p className="text-[10px] text-blue-300/40 uppercase tracking-widest mb-1">Saldo disponível</p>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[28px] font-extrabold text-white tracking-tight">
                  {showValues ? formatCurrency(assinante.cashback || 0) : 'R$ •••••'}
                </h1>
                <button
                  onClick={() => setShowValues(!showValues)}
                  className="p-1.5 rounded-full text-white/30 hover:text-white/60 transition-all"
                  title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
                >
                  {showValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Métricas — 3 cards glass */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-xl p-3 text-center">
                <Coins className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                <p className="text-base font-bold text-white">
                  {showValues ? Number(assinante.points || 0).toLocaleString('pt-BR') : '•••'}
                </p>
                <p className="text-[9px] text-white/30">Pontos</p>
              </div>
              <div className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-xl p-3 text-center">
                <TrendingUp className="h-4 w-4 text-green-400 mx-auto mb-1" />
                <p className="text-base font-bold text-white">
                  {showValues ? formatCurrency((assinante.cashback || 0) + (assinante.points || 0) * 0.01) : '•••'}
                </p>
                <p className="text-[9px] text-white/30">Economia</p>
              </div>
              <Link href="/app/carteira" className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-xl p-3 text-center hover:bg-white/[0.1] transition-colors">
                <Wallet className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                <p className="text-[10px] font-semibold text-white">Carteira</p>
                <p className="text-[9px] text-white/30">QR Code</p>
              </Link>
            </div>
          </div>
        </div>
        <div className="h-4 bg-gradient-to-b from-[#0a1628] to-[#f8fafc] rounded-b-[16px]" />
      </div>

      {/* ========== DESKTOP HERO (LIGHT) ========== */}
      <div className="hidden lg:block relative">
        <div className="bg-white border-b border-gray-200">
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-100/40 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-50/60 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

          <div className="relative px-10 py-8">
            {/* Saudação */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-900 font-semibold text-lg">Olá, {user.firstName}</p>
                <div className="flex items-center gap-1.5">
                  <Crown className="h-3 w-3 text-amber-500" />
                  <span className="text-[12px] text-gray-400">{assinante.plan?.name || 'Plano'}</span>
                </div>
              </div>
              <NotificationBell variant="light" />
            </div>

            {/* Saldo + Toggle */}
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Saldo disponível</p>
                <h1 className="text-[36px] font-extrabold text-gray-900 tracking-tight">
                  {showValues ? formatCurrency(assinante.cashback || 0) : 'R$ •••••'}
                </h1>
              </div>
              <button
                onClick={() => setShowValues(!showValues)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all text-xs"
                title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
              >
                {showValues ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                <span>{showValues ? 'Ocultar' : 'Mostrar'}</span>
              </button>
            </div>

            {/* Métricas — 4 cards */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50 rounded-2xl p-4 text-center">
                <Coins className="h-5 w-5 text-amber-500 mx-auto mb-1.5" />
                <p className="text-xl font-bold text-gray-900">
                  {showValues ? Number(assinante.points || 0).toLocaleString('pt-BR') : '•••'}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Pontos</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50 rounded-2xl p-4 text-center">
                <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1.5" />
                <p className="text-xl font-bold text-gray-900">
                  {showValues ? formatCurrency((assinante.cashback || 0) + (assinante.points || 0) * 0.01) : '•••'}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Economia</p>
              </div>
              <Link href="/app/carteira" className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 rounded-2xl p-4 text-center hover:shadow-md hover:border-blue-300/60 transition-all">
                <Wallet className="h-5 w-5 text-blue-500 mx-auto mb-1.5" />
                <p className="text-sm font-semibold text-gray-900">Carteira</p>
                <p className="text-[11px] text-gray-400 mt-0.5">QR Code</p>
              </Link>
              {isConvite ? (
                <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl p-4 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                  <div className="relative">
                    <Crown className="h-5 w-5 text-amber-400 mx-auto mb-1.5" />
                    <p className="text-sm font-semibold text-white">Convite</p>
                    <p className="text-[10px] text-green-400/80 mt-1 flex items-center justify-center gap-0.5">
                      ✓ Acesso Total
                    </p>
                  </div>
                </div>
              ) : (
                <Link href="/app/planos" className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl p-4 text-center hover:shadow-lg transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                  <div className="relative">
                    <Crown className="h-5 w-5 text-amber-400 mx-auto mb-1.5" />
                    <p className="text-sm font-semibold text-white">{assinante.plan?.name}</p>
                    <p className="text-[10px] text-amber-400/80 mt-1 flex items-center justify-center gap-0.5">
                      <Zap className="h-3 w-3" /> Upgrade
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== CARROSSEL DESTAQUES ===== */}
      {destaques.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-10 -mt-1">
          <CarouselDestaques destaques={destaques} />
        </div>
      )}

      {/* ===== PARCEIROS EM DESTAQUE ===== */}
      {parceirosDestaque.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-10 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-blue-600" /> Em Destaque
            </h2>
            <Link href="/app/parceiros?destaque=true" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              Ver todos →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {parceirosDestaque.slice(0, 8).map((p) => (
              <Link key={p.id} href={`/app/parceiros/${p.id}`} className="flex-shrink-0 w-[140px]">
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-100 transition-all">
                  <div className="h-16 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    {p.logo ? (
                      <Image src={p.logo} alt={p.nomeFantasia} width={48} height={48} className="object-contain rounded-lg" unoptimized />
                    ) : (
                      <Building2 className="h-6 w-6 text-blue-300" />
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-gray-900 truncate">{p.nomeFantasia}</p>
                    <p className="text-[10px] text-gray-400 truncate">{p.category}</p>
                    {p.desconto && (
                      <span className="inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                        {p.desconto}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ===== CATEGORIAS ===== */}
      {categories.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-10 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">Categorias</h2>
            <Link href="/app/categorias" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              Ver todas →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/app/categoria/${cat.slug}`} className="flex-shrink-0">
                <div className="flex flex-col items-center gap-1.5 w-[72px]">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                    {cat.banner ? (
                      <Image src={cat.banner} alt={cat.name} width={56} height={56} className="object-cover w-full h-full" unoptimized />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                        <Store className="h-5 w-5 text-blue-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-medium text-gray-600 text-center leading-tight line-clamp-2">{cat.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ===== PARCEIROS DO SEU PLANO ===== */}
      {parceiros.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-10 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Crown className="h-4 w-4 text-blue-600" /> Parceiros do seu Plano
            </h2>
            <Link href="/app/parceiros" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              Ver todos →
            </Link>
          </div>
          <p className="text-[11px] text-gray-400 -mt-1.5 mb-3">
            Empresas com benefícios para o plano {assinante.plan?.name}
          </p>

          {/* Mobile: grid 3 colunas */}
          <div className="grid grid-cols-3 gap-2 lg:hidden">
            {parceiros.slice(0, 9).map((p) => {
              const mainBenefit = p.benefits[0]
              const badge = mainBenefit ? getBenefitBadge(mainBenefit.type, mainBenefit.value) : null
              return (
                <Link key={p.id} href={`/app/parceiros/${p.id}`}>
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-all active:scale-[0.97] p-2.5 text-center">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mx-auto mb-1.5">
                      {p.logo ? (
                        <Image src={p.logo} alt={p.tradeName || p.companyName} width={48} height={48} className="object-cover w-full h-full" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                          <Building2 className="h-5 w-5 text-blue-300" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-gray-900 truncate">{p.tradeName || p.companyName}</p>
                    <p className="text-[9px] text-gray-400 truncate">{p.city?.name || p.category}</p>
                    {badge && (
                      <span className={`inline-block mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded ${badge.color}`}>
                        {badge.text}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Desktop: grid responsivo */}
          <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {parceiros.slice(0, 9).map((p) => {
              const mainBenefit = p.benefits[0]
              const badge = mainBenefit ? getBenefitBadge(mainBenefit.type, mainBenefit.value) : null
              return (
                <Link key={p.id} href={`/app/parceiros/${p.id}`}>
                  <div className="flex items-center gap-3.5 p-3.5 bg-white rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-sm transition-all">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                      {p.logo ? (
                        <Image src={p.logo} alt={p.tradeName || p.companyName} width={48} height={48} className="object-cover w-full h-full" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                          <Building2 className="h-5 w-5 text-blue-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900 truncate">{p.tradeName || p.companyName}</p>
                        {p.avaliacoes.total > 0 && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-[11px] font-medium text-gray-500">{p.avaliacoes.media.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 truncate">
                        {p.category}{p.city && <> · {p.city.name}</>}
                      </p>
                      {badge && (
                        <span className={`inline-block mt-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded ${badge.color}`}>
                          {badge.text}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== ATIVIDADE RECENTE ===== */}
      <div className="px-4 sm:px-6 lg:px-10 mt-6">
        <RecentTransactions showValues={showValues} />
      </div>

      {/* ===== UPGRADE DE PLANO ===== */}
      {planosUpgrade.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-10 mt-6">
          <div className="p-4 bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl overflow-hidden relative">
            {/* Decoração */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white">Faça Upgrade</h2>
              </div>
              <p className="text-[11px] text-white/50 mb-4">Desbloqueie mais benefícios e parceiros</p>

              <div className="space-y-2.5">
                {planosUpgrade.map((plan) => (
                  <Link key={plan.id} href="/app/planos">
                    <div className="flex items-center justify-between p-3 bg-white/[0.07] border border-white/10 rounded-xl hover:bg-white/[0.12] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-400/15 flex items-center justify-center">
                          <Crown className="h-4 w-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-white">{plan.name}</p>
                          <p className="text-[10px] text-white/40">{plan.planBenefits.length} benefícios</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-white">{formatCurrency(plan.price)}</p>
                        <ArrowRight className="h-4 w-4 text-white/30" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== FALLBACK VAZIO ===== */}
      {!destaques.length && !parceirosDestaque.length && !parceiros.length && (
        <div className="px-4 sm:px-6 lg:px-10 text-center py-12">
          <Store className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Nenhum parceiro disponível no momento.</p>
          <p className="text-xs text-gray-300 mt-1">Novos parceiros em breve!</p>
        </div>
      )}
    </div>
  )
}
