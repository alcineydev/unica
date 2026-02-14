'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Crown, Zap, Check, ArrowRight, Loader2, Sparkles, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface PlanBenefit {
  benefit: { id: string; name: string; type: string }
}

interface Plan {
  id: string
  name: string
  slug: string | null
  description: string
  price: number
  priceMonthly: number | null
  features: string[]
  planBenefits: PlanBenefit[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function PlanosAssinantePage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/app/home')
        const result = await res.json()
        if (result.data) {
          setPlans(result.data.planosDisponiveis || [])
          setCurrentPlanId(result.data.currentPlanId || null)
        }
      } catch {
        toast.error('Erro ao carregar planos')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const activePlans = plans.filter(p => Number(p.price) > 0)
  const currentPlan = activePlans.find(p => p.id === currentPlanId)
  const currentPrice = currentPlan ? Number(currentPlan.price) : 0

  return (
    <div className="pb-24 px-4 pt-4 lg:px-8 lg:pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Planos</h1>
        <p className="text-sm text-gray-400 mt-0.5">Gerencie sua assinatura</p>
      </div>

      {/* Plano Atual */}
      {currentPlan && (
        <div className="mb-6 p-4 bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center">
                <Crown className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-white/40">Plano atual</p>
                <p className="text-base font-bold text-white">{currentPlan.name}</p>
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="text-2xl font-extrabold text-white">{formatCurrency(Number(currentPlan.price))}</span>
              <span className="text-xs text-white/40">/mês</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Shield className="h-3.5 w-3.5 text-green-400" />
              <span className="text-[11px] text-green-400">Assinatura ativa</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {currentPlan.planBenefits.slice(0, 4).map((pb) => (
                <span key={pb.benefit.id} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-white/50">
                  {pb.benefit.name}
                </span>
              ))}
              {currentPlan.planBenefits.length > 4 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-white/50">
                  +{currentPlan.planBenefits.length - 4} mais
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Outros planos */}
      <div className="space-y-3">
        {!currentPlan && (
          <div className="text-center py-6 mb-4">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Crown className="h-7 w-7 text-blue-600" />
            </div>
            <h2 className="font-bold text-gray-900 mb-1">Escolha seu Plano</h2>
            <p className="text-sm text-gray-400">Assine para acessar benefícios exclusivos</p>
          </div>
        )}

        {activePlans
          .filter(p => p.id !== currentPlanId)
          .sort((a, b) => Number(a.price) - Number(b.price))
          .map((plan, index) => {
            const isUpgrade = Number(plan.price) > currentPrice
            const isDowngrade = Number(plan.price) < currentPrice && currentPlanId !== null
            const isBestValue = index === 0 && !currentPlanId

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border overflow-hidden transition-all ${
                  isBestValue
                    ? 'border-blue-200 shadow-md shadow-blue-100/40'
                    : 'border-gray-200 hover:border-blue-200 hover:shadow-sm'
                }`}
              >
                {isBestValue && (
                  <div className="bg-blue-600 text-white text-[10px] font-bold text-center py-1 uppercase tracking-wider">
                    Mais Popular
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-gray-900">{formatCurrency(Number(plan.price))}</p>
                      <p className="text-[10px] text-gray-400">/mês</p>
                    </div>
                  </div>

                  {/* Benefícios */}
                  <div className="space-y-1.5 mb-4">
                    {plan.planBenefits.slice(0, 5).map((pb) => (
                      <div key={pb.benefit.id} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        <span className="text-xs text-gray-600">{pb.benefit.name}</span>
                      </div>
                    ))}
                    {plan.planBenefits.length > 5 && (
                      <p className="text-[11px] text-gray-400 ml-5">+{plan.planBenefits.length - 5} benefícios</p>
                    )}
                  </div>

                  {/* Features */}
                  {plan.features && plan.features.length > 0 && (
                    <div className="space-y-1 mb-4">
                      {plan.features.slice(0, 3).map((feat, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Sparkles className="h-3 w-3 text-blue-400 shrink-0" />
                          <span className="text-[11px] text-gray-500">{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <Link href={`/checkout/${plan.slug || plan.id}`}>
                    <button className={`w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                      isUpgrade || !currentPlanId
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200/40'
                        : isDowngrade
                          ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}>
                      {isUpgrade ? (
                        <><Zap className="h-4 w-4" /> Fazer Upgrade</>
                      ) : isDowngrade ? (
                        <>Trocar para este plano</>
                      ) : (
                        <><ArrowRight className="h-4 w-4" /> Assinar agora</>
                      )}
                    </button>
                  </Link>
                </div>
              </div>
            )
          })}
      </div>

      {/* Info */}
      <div className="mt-6 text-center">
        <p className="text-[10px] text-gray-300">
          Ao assinar você concorda com nossos termos de uso. Cobranças recorrentes via Asaas.
        </p>
      </div>
    </div>
  )
}
