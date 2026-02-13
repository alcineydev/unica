'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Check,
  Loader2,
  Crown,
  Sparkles,
  Star,
  Percent,
  Gift,
  Coins,
  ChevronRight,
  Zap,
  ArrowLeft,
  Shield,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ==========================================
// Tipos
// ==========================================

interface Benefit {
  id: string
  name: string
  type: string
  value: number
  description?: string
}

interface Plan {
  id: string
  name: string
  slug: string | null
  description?: string
  price: number
  priceMonthly: number | null
  priceYearly: number | null
  period: string
  features: string[]
  benefits: Benefit[]
}

interface Subscription {
  status: string
  startDate: string | null
  endDate: string | null
}

// ==========================================
// Helpers
// ==========================================

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price)
}

function getPeriodLabel(period: string) {
  switch (period) {
    case 'MONTHLY': return '/mês'
    case 'QUARTERLY': return '/trimestre'
    case 'SEMIANNUAL': return '/semestre'
    case 'YEARLY': return '/ano'
    default: return '/mês'
  }
}

function getBenefitIcon(type: string) {
  switch (type) {
    case 'DISCOUNT': return <Percent className="h-4 w-4 text-green-500" />
    case 'CASHBACK': return <Coins className="h-4 w-4 text-yellow-500" />
    case 'POINTS': return <Star className="h-4 w-4 text-blue-500" />
    case 'FREEBIE': return <Gift className="h-4 w-4 text-purple-500" />
    default: return <Check className="h-4 w-4 text-primary" />
  }
}

function getBenefitText(benefit: Benefit) {
  switch (benefit.type) {
    case 'DISCOUNT': return `${benefit.value}% de desconto`
    case 'CASHBACK': return `${benefit.value}% de cashback`
    case 'POINTS': return `${benefit.value} pontos/compra`
    case 'FREEBIE': return 'Brinde exclusivo'
    default: return benefit.name
  }
}

function getPlanIcon(index: number, isPopular: boolean) {
  if (isPopular) return <Crown className="h-6 w-6" />
  if (index === 0) return <Zap className="h-6 w-6" />
  return <Sparkles className="h-6 w-6" />
}

// ==========================================
// Componente Principal
// ==========================================

export default function PlanosPage() {
  const router = useRouter()

  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // ==========================================
  // Fetch planos
  // ==========================================

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/app/planos', { cache: 'no-store' })
      const data = await response.json()

      if (data.plans) setPlans(data.plans)
      if (data.currentPlan?.id) setCurrentPlanId(data.currentPlan.id)
      else if (data.currentPlanId) setCurrentPlanId(data.currentPlanId)
      if (data.subscription) setSubscription(data.subscription)
    } catch (error) {
      console.error('Erro ao buscar planos:', error)
      toast.error('Erro ao carregar planos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  // ==========================================
  // Ação de checkout
  // ==========================================

  const handleCheckout = async (plan: Plan) => {
    setProcessingId(plan.id)

    try {
      const price = Number(plan.priceMonthly || plan.price)

      // ---- Plano pago: redireciona para checkout Asaas ----
      if (price > 0) {
        if (plan.slug) {
          // Redirect direto para checkout Asaas público
          router.push(`/checkout/${plan.slug}`)
          return
        }

        // Plano pago sem slug → tenta via API
        const response = await fetch('/api/app/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: plan.id }),
        })

        const data = await response.json()

        if (!response.ok) {
          toast.error(data.error || 'Erro ao processar checkout')
          return
        }

        if (data.checkoutUrl) {
          router.push(data.checkoutUrl)
          return
        }

        toast.error('Checkout indisponível para este plano')
        return
      }

      // ---- Plano gratuito: ativa direto via API ----
      const response = await fetch('/api/app/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erro ao ativar plano')
        return
      }

      toast.success(data.message || 'Plano ativado com sucesso!')
      router.push(data.redirect || '/app')
    } catch (error) {
      console.error('Erro no checkout:', error)
      toast.error('Erro ao processar. Tente novamente.')
    } finally {
      setProcessingId(null)
    }
  }

  // ==========================================
  // Loading state
  // ==========================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background pb-24">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-5 w-64 mx-auto" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold">Escolha seu Plano</h1>
            {subscription?.status === 'ACTIVE' && (
              <p className="text-xs text-muted-foreground">
                Gerencie ou troque seu plano
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Subtítulo */}
        <p className="text-muted-foreground text-center mb-8">
          Aproveite os melhores benefícios e descontos exclusivos em nossos parceiros
        </p>

        {/* Sem planos */}
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum plano disponível no momento.</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-lg mx-auto">
            {plans.map((plan, index) => {
              const isCurrentPlan = plan.id === currentPlanId
              const isPopular =
                index === Math.floor(plans.length / 2) && plans.length > 1
              const price = Number(plan.priceMonthly || plan.price)
              const isFree = price <= 0

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    'relative transition-all duration-300',
                    isPopular && !isCurrentPlan && 'border-primary shadow-lg',
                    isCurrentPlan && 'ring-2 ring-green-500 border-green-200'
                  )}
                >
                  {/* Badge Popular */}
                  {isPopular && !isCurrentPlan && (
                    <div className="absolute -top-3 left-4 z-10">
                      <Badge className="bg-primary text-primary-foreground shadow-sm">
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  {/* Badge Plano Atual */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-4 z-10">
                      <Badge className="bg-green-500 text-white shadow-sm">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    </div>
                  )}

                  <CardHeader
                    className={cn(
                      'pb-2',
                      (isPopular || isCurrentPlan) && 'pt-6'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center',
                            isCurrentPlan
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                              : isPopular
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {getPlanIcon(index, isPopular)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {plan.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {isFree ? (
                          <div className="text-2xl font-bold text-green-600">
                            Grátis
                          </div>
                        ) : (
                          <>
                            <div className="text-2xl font-bold">
                              {formatPrice(price)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {getPeriodLabel(plan.period)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Benefícios */}
                    {plan.benefits && plan.benefits.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Benefícios inclusos
                        </p>
                        <ul className="space-y-2">
                          {plan.benefits.map((benefit) => (
                            <li
                              key={benefit.id}
                              className="flex items-start gap-3"
                            >
                              <div className="mt-0.5">
                                {getBenefitIcon(benefit.type)}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {benefit.name}
                                </p>
                                <p className="text-xs text-green-600">
                                  {getBenefitText(benefit)}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Features extras */}
                    {plan.features && plan.features.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Vantagens
                        </p>
                        <ul className="space-y-1">
                          {(plan.features as string[]).map(
                            (feature: string, i: number) => (
                              <li
                                key={i}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-2">
                    <Button
                      className={cn(
                        'w-full h-12',
                        isPopular &&
                          !isCurrentPlan &&
                          'bg-primary hover:bg-primary/90'
                      )}
                      variant={
                        isCurrentPlan
                          ? 'outline'
                          : isPopular
                            ? 'default'
                            : 'secondary'
                      }
                      disabled={isCurrentPlan || processingId === plan.id}
                      onClick={() => handleCheckout(plan)}
                    >
                      {processingId === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processando...
                        </>
                      ) : isCurrentPlan ? (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                          Plano Atual
                        </>
                      ) : isFree ? (
                        <>
                          Ativar Grátis
                          <ChevronRight className="ml-2 h-5 w-5" />
                        </>
                      ) : (
                        <>
                          Assinar Plano
                          <ChevronRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}

        {/* Informações adicionais */}
        <div className="mt-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            Pagamento seguro via Asaas
          </div>
          <p className="text-xs text-muted-foreground">
            Cancele quando quiser - sem fidelidade
          </p>
        </div>
      </div>
    </div>
  )
}
