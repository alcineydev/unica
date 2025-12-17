'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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
  period: string
  features: string[]
  isPopular?: boolean
  benefits: Benefit[]
}

export default function PlanosPage() {
  const router = useRouter()
  
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/app/planos', {
        cache: 'no-store'
      })
      const data = await response.json()
      
      if (data.plans) {
        setPlans(data.plans)
      }
      if (data.currentPlanId) {
        setCurrentPlanId(data.currentPlanId)
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error)
      toast.error('Erro ao carregar planos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckout = async (plan: Plan) => {
    setCheckoutLoading(plan.id)
    
    // Redireciona para o checkout público com o ID do plano
    router.push(`/checkout?plano=${plan.id}`)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'MONTHLY': return '/mês'
      case 'QUARTERLY': return '/trimestre'
      case 'SEMIANNUAL': return '/semestre'
      case 'YEARLY': return '/ano'
      default: return '/mês'
    }
  }

  const getBenefitIcon = (type: string) => {
    switch (type) {
      case 'DISCOUNT': return <Percent className="h-4 w-4 text-green-500" />
      case 'CASHBACK': return <Coins className="h-4 w-4 text-yellow-500" />
      case 'POINTS': return <Star className="h-4 w-4 text-blue-500" />
      case 'FREEBIE': return <Gift className="h-4 w-4 text-purple-500" />
      default: return <Check className="h-4 w-4 text-primary" />
    }
  }

  const getBenefitText = (benefit: Benefit) => {
    switch (benefit.type) {
      case 'DISCOUNT': return `${benefit.value}% de desconto`
      case 'CASHBACK': return `${benefit.value}% de cashback`
      case 'POINTS': return `${benefit.value} pontos/compra`
      case 'FREEBIE': return 'Brinde exclusivo'
      default: return benefit.name
    }
  }

  const getPlanIcon = (index: number, isPopular: boolean) => {
    if (isPopular) return <Crown className="h-6 w-6" />
    if (index === 0) return <Zap className="h-6 w-6" />
    return <Sparkles className="h-6 w-6" />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando planos...</p>
        </div>
      </div>
    )
  }

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
          <h1 className="text-lg font-bold">Escolha seu Plano</h1>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Subtítulo */}
        <p className="text-muted-foreground text-center mb-8">
          Aproveite os melhores benefícios e descontos exclusivos em nossos parceiros
        </p>

        {/* Planos */}
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum plano disponível no momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan, index) => {
              const isCurrentPlan = plan.id === currentPlanId
              const isPopular = index === Math.floor(plans.length / 2) && plans.length > 1
              
              return (
                <Card 
                  key={plan.id}
                  className={cn(
                    "relative transition-all duration-300",
                    isPopular && "border-primary shadow-lg",
                    isCurrentPlan && "ring-2 ring-green-500"
                  )}
                >
                  {/* Badge Popular */}
                  {isPopular && !isCurrentPlan && (
                    <div className="absolute -top-3 left-4">
                      <Badge className="bg-primary text-primary-foreground">
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  {/* Badge Plano Atual */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-4">
                      <Badge className="bg-green-500 text-white">
                        Seu Plano Atual
                      </Badge>
                    </div>
                  )}

                  <CardHeader className={cn("pb-2", (isPopular || isCurrentPlan) && "pt-6")}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          isPopular ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {getPlanIcon(index, isPopular)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          {plan.description && (
                            <CardDescription className="text-sm">{plan.description}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{formatPrice(plan.price)}</div>
                        <div className="text-xs text-muted-foreground">{getPeriodLabel(plan.period)}</div>
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
                            <li key={benefit.id} className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {getBenefitIcon(benefit.type)}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{benefit.name}</p>
                                <p className="text-xs text-green-600">{getBenefitText(benefit)}</p>
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
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-2">
                    <Button
                      className={cn(
                        "w-full h-12",
                        isPopular && !isCurrentPlan && "bg-primary hover:bg-primary/90"
                      )}
                      variant={isCurrentPlan ? "outline" : isPopular ? "default" : "secondary"}
                      disabled={isCurrentPlan || checkoutLoading === plan.id}
                      onClick={() => handleCheckout(plan)}
                    >
                      {checkoutLoading === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processando...
                        </>
                      ) : isCurrentPlan ? (
                        'Plano Atual'
                      ) : (
                        <>
                          Assinar Agora
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
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            🔒 Pagamento seguro via Mercado Pago
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Cancele quando quiser
          </p>
        </div>
      </div>
    </div>
  )
}

