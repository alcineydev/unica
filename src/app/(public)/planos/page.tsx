'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Check,
  Gift,
  Star,
  Zap,
  Shield,
  QrCode,
  ArrowRight,
  ChevronLeft,
  Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Plan {
  id: string
  name: string
  slug: string | null
  description: string
  price: number
  priceMonthly: number | null
  priceYearly: number | null
  period: string
  features: string[]
  benefits: Array<{
    id: string
    name: string
    description: string
    type: string
  }>
}

export default function PlanosPublicPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/plans/public')
      const data = await res.json()
      if (data.plans) {
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const handleSelectPlan = (plan: Plan) => {
    const identifier = plan.slug || plan.id
    if (plan.price === 0) {
      // Plano gratuito: vai direto pro cadastro
      router.push(`/cadastro?plano=${plan.id}`)
    } else {
      // Plano pago: vai pro checkout Asaas
      router.push(`/checkout/${identifier}`)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'YEARLY': return '/ano'
      case 'SINGLE': return ' unico'
      default: return '/mes'
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-12 w-80 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Gift className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold">UNICA</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Inicio
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-12 md:py-16 text-center">
        <Badge className="mb-4" variant="secondary">
          <Crown className="h-3 w-3 mr-1" />
          Escolha seu plano
        </Badge>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          Comece a Economizar{' '}
          <span className="text-primary">Hoje</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Escolha o plano ideal para voce e tenha acesso a descontos exclusivos,
          cashback e pontos em centenas de parceiros.
        </p>
      </section>

      {/* Plans Grid */}
      <section className="container mx-auto px-4 pb-16">
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhum plano disponivel no momento.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/">Voltar ao inicio</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan, index) => {
              const isPopular = plans.length >= 2 && index === 1
              const isFree = plan.price === 0

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    'relative overflow-hidden transition-all hover:shadow-lg rounded-2xl',
                    isPopular && 'border-primary shadow-lg lg:scale-105 z-10'
                  )}
                >
                  {/* Popular badge */}
                  {isPopular && (
                    <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-1.5 text-xs font-semibold">
                      <Star className="inline h-3 w-3 mr-1" />
                      Mais Popular
                    </div>
                  )}

                  <CardContent className={cn('p-6', isPopular && 'pt-10')}>
                    {/* Name */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      {isFree ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-green-600">Gratis</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                            <span className="text-sm text-muted-foreground">{getPeriodLabel(plan.period)}</span>
                          </div>
                          {plan.priceYearly && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ou {formatPrice(plan.priceYearly)}/ano
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* CTA */}
                    <Button
                      className="w-full mb-6"
                      variant={isPopular ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {isFree ? (
                        <>Criar Conta Gratis</>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Assinar {plan.name}
                        </>
                      )}
                    </Button>

                    <Separator className="mb-4" />

                    {/* Features */}
                    {plan.features && plan.features.length > 0 && (
                      <div className="space-y-2.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Incluso no plano
                        </p>
                        {plan.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Benefits */}
                    {plan.benefits && plan.benefits.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Beneficios
                        </p>
                        {plan.benefits.slice(0, 5).map((benefit) => (
                          <div key={benefit.id} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <div>
                              <span className="text-sm font-medium">{benefit.name}</span>
                              {benefit.description && (
                                <p className="text-xs text-muted-foreground">{benefit.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {plan.benefits.length > 5 && (
                          <p className="text-xs text-muted-foreground pl-6">
                            +{plan.benefits.length - 5} beneficios inclusos
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Trust */}
      <section className="py-8 border-t bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Pagamento seguro via Asaas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <QrCode className="h-4 w-4 text-primary" />
              <span>PIX, Cartao e Boleto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-amber-500" />
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ resumido */}
      <section className="py-12 container mx-auto px-4">
        <h2 className="text-xl font-bold text-center mb-8">Perguntas Frequentes</h2>
        <div className="max-w-2xl mx-auto space-y-4">
          {[
            {
              q: 'Como funciona o pagamento?',
              a: 'Voce escolhe entre PIX (aprovacao instantanea), cartao de credito ou boleto bancario. O plano e ativado automaticamente apos a confirmacao.',
            },
            {
              q: 'Posso cancelar a qualquer momento?',
              a: 'Sim! Voce pode cancelar sua assinatura quando quiser, sem multa ou fidelidade.',
            },
            {
              q: 'Como uso meus beneficios?',
              a: 'Apos assinar, voce recebe um QR Code exclusivo. Basta apresentar nos parceiros para obter seus descontos e cashback.',
            },
          ].map((faq, i) => (
            <div key={i} className="bg-muted/30 rounded-xl p-4 border">
              <p className="font-medium text-sm mb-1">{faq.q}</p>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="py-12 container mx-auto px-4">
        <div className="max-w-xl mx-auto text-center bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 text-white">
          <h2 className="text-xl font-bold mb-2">Ainda tem duvidas?</h2>
          <p className="text-white/80 text-sm mb-4">
            Crie uma conta gratuita e conheca o clube sem compromisso.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <Button variant="secondary" asChild>
              <Link href="/cadastro">
                Criar Conta Gratis
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" asChild>
              <Link href="/login">Ja tenho conta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} UNICA Clube de Beneficios - Grupo Zan Norte</p>
          <div className="flex items-center gap-4">
            <Link href="/termos" className="hover:text-foreground transition-colors">
              Termos
            </Link>
            <Link href="/privacidade" className="hover:text-foreground transition-colors">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
