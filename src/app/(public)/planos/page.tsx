'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Crown, Check, ArrowRight, Shield, Zap, Star,
  Gift, Percent, Sparkles, Lock, CreditCard,
  QrCode, FileText, ArrowLeft,
  Store, BadgeCheck, Heart
} from 'lucide-react'

interface PlanBenefit {
  benefit: {
    id: string
    name: string
    type: string
    description: string | null
  }
}

interface Plan {
  id: string
  name: string
  slug: string | null
  description: string | null
  price: number
  period: string
  features: string[]
  benefits?: Array<{
    id: string
    name: string
    type: string
    description: string | null
  }>
  planBenefits?: PlanBenefit[]
}

export default function PlanosPublicPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans/public')
      if (!res.ok) throw new Error('Erro ao carregar planos')
      const data = await res.json()
      const list = data.plans || (Array.isArray(data) ? data : data.data || [])
      setPlans(list)
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlanUrl = (plan: Plan) => `/checkout/${plan.slug || plan.id}`

  const periodLabel = (period: string) => {
    if (period === 'YEARLY') return '/ano'
    if (period === 'SINGLE') return 'único'
    return '/mês'
  }

  const highlightIndex = plans.length <= 1 ? 0 : 1

  // Extrair benefícios do plano (suporta ambos formatos da API)
  const getPlanBenefits = (plan: Plan) => {
    if (plan.benefits && plan.benefits.length > 0) return plan.benefits
    if (plan.planBenefits && plan.planBenefits.length > 0) {
      return plan.planBenefits.map((pb) => pb.benefit)
    }
    return []
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ====== HEADER ====== */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-sm">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg leading-none">UNICA</span>
              <span className="text-[10px] text-muted-foreground block leading-none">Clube de Benefícios</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-1" /> Início
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ====== HERO ====== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-12 md:pt-24 md:pb-16 text-center">
          <Badge variant="secondary" className="mb-5 px-4 py-1.5 text-sm">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Escolha seu plano
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Comece a Economizar Hoje
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Escolha o plano ideal para você e tenha acesso a descontos exclusivos, cashback
            e pontos em centenas de parceiros.
          </p>
        </div>
      </section>

      {/* ====== PLANS ====== */}
      <section className="px-4 pb-16 md:pb-24 -mt-4" id="plans">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-8 pb-6 px-6">
                    <div className="h-6 bg-muted rounded w-24 mb-2" />
                    <div className="h-4 bg-muted rounded w-40 mb-6" />
                    <div className="h-12 bg-muted rounded w-36 mb-6" />
                    <div className="h-10 bg-muted rounded w-full mb-6" />
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="h-4 bg-muted rounded w-full" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : plans.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="py-16 text-center">
                <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-semibold mb-2">Nenhum plano disponível no momento.</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Estamos preparando novos planos. Volte em breve!
                </p>
                <Button variant="outline" asChild>
                  <Link href="/">Voltar ao início</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid gap-6 ${
              plans.length === 1 ? 'max-w-md mx-auto' :
              plans.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' :
              'lg:grid-cols-3 max-w-5xl mx-auto'
            }`}>
              {plans.map((plan, index) => {
                const price = Number(plan.price)
                const isHighlight = index === highlightIndex && plans.length > 1
                const benefits = getPlanBenefits(plan)

                return (
                  <Card
                    key={plan.id}
                    className={`relative overflow-hidden transition-all duration-300 ${
                      isHighlight
                        ? 'border-primary shadow-xl shadow-primary/10 md:scale-[1.03] z-10'
                        : 'border-border hover:border-primary/40 hover:shadow-lg'
                    }`}
                  >
                    {/* Highlight ribbon */}
                    {isHighlight && (
                      <div className="bg-gradient-to-r from-primary to-primary/90 text-white text-center py-2 text-xs font-semibold tracking-widest uppercase">
                        <Star className="h-3 w-3 inline mr-1" />
                        Mais Popular
                      </div>
                    )}

                    <CardContent className={`${isHighlight ? 'pt-6' : 'pt-8'} pb-6 px-6`}>
                      {/* Plan name */}
                      <div className="mb-5">
                        <h3 className="text-xl font-bold">{plan.name}</h3>
                        {plan.description && (
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{plan.description}</p>
                        )}
                      </div>

                      {/* Price */}
                      <div className="mb-6">
                        {price === 0 ? (
                          <div>
                            <span className="text-4xl font-bold text-green-600">Grátis</span>
                            <p className="text-xs text-muted-foreground mt-1">Sem compromisso</p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-medium text-muted-foreground">R$</span>
                              <span className="text-4xl font-bold tracking-tight">
                                {price.toFixed(2).replace('.', ',')}
                              </span>
                              <span className="text-sm text-muted-foreground">{periodLabel(plan.period)}</span>
                            </div>
                            {plan.period === 'MONTHLY' && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Cobrado mensalmente
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <Button
                        className={`w-full mb-6 h-12 text-base font-semibold ${
                          isHighlight ? 'shadow-md shadow-primary/20' : ''
                        }`}
                        variant={isHighlight ? 'default' : price === 0 ? 'outline' : 'default'}
                        size="lg"
                        asChild
                      >
                        <Link href={price === 0 ? '/cadastro' : getPlanUrl(plan)}>
                          <Zap className="h-4 w-4 mr-2" />
                          {price === 0 ? 'Criar Conta Grátis' : `Assinar ${plan.name}`}
                        </Link>
                      </Button>

                      <Separator className="mb-5" />

                      {/* Features */}
                      {plan.features && plan.features.length > 0 && (
                        <div className="space-y-3 mb-5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            O que está incluso:
                          </p>
                          {plan.features.map((feature, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <div className="mt-0.5 w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                <Check className="h-2.5 w-2.5 text-green-600" />
                              </div>
                              <span className="text-sm leading-snug">{feature}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Benefícios */}
                      {benefits.length > 0 && (
                        <div className="pt-4 border-t">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Benefícios:
                          </p>
                          <div className="space-y-2">
                            {benefits.slice(0, 5).map((b, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <Gift className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="text-sm text-muted-foreground">{b.name}</span>
                              </div>
                            ))}
                            {benefits.length > 5 && (
                              <p className="text-xs text-primary font-medium pl-5">
                                +{benefits.length - 5} benefício{benefits.length - 5 > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="py-16 md:py-20 bg-muted/30 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Como funciona?</h2>
            <p className="text-muted-foreground">Comece a economizar em 3 passos simples</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Crown,
                title: 'Escolha seu plano',
                desc: 'Selecione o plano que melhor se encaixa no seu perfil e faça o pagamento de forma segura.',
                color: 'from-primary/10 to-primary/5 text-primary',
                step: '01',
              },
              {
                icon: QrCode,
                title: 'Receba seu cartão digital',
                desc: 'Após a assinatura, acesse seu QR Code exclusivo pelo app para usar nos parceiros.',
                color: 'from-green-500/10 to-green-500/5 text-green-600',
                step: '02',
              },
              {
                icon: Percent,
                title: 'Economize sempre',
                desc: 'Apresente seu cartão e aproveite descontos, cashback e benefícios em cada compra.',
                color: 'from-amber-500/10 to-amber-500/5 text-amber-600',
                step: '03',
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className={`bg-gradient-to-br ${item.color} rounded-2xl p-6 h-full`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl font-bold opacity-15">{item.step}</span>
                    <item.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== BENEFITS ====== */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Por que ser UNICA?</h2>
            <p className="text-muted-foreground">Vantagens exclusivas para nossos assinantes</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Store, title: 'Parceiros locais', desc: 'Dezenas de estabelecimentos parceiros na sua cidade' },
              { icon: Percent, title: 'Descontos reais', desc: 'Economia de verdade em cada compra que você fizer' },
              { icon: ArrowRight, title: 'Cashback', desc: 'Receba parte do valor de volta em compras selecionadas' },
              { icon: Heart, title: 'Benefícios exclusivos', desc: 'Acesso a promoções e eventos especiais do clube' },
            ].map((item, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6 pb-5 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ====== FAQ ====== */}
      <section className="py-16 md:py-20 bg-muted/30 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Perguntas Frequentes</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'Como funciona o clube de benefícios?', a: 'Ao assinar, você recebe um cartão digital (QR Code) que dá acesso a descontos e benefícios em diversos parceiros da sua cidade.' },
              { q: 'Como uso meus benefícios?', a: 'Basta apresentar seu QR Code no app nos estabelecimentos parceiros. O desconto é aplicado na hora!' },
              { q: 'Posso cancelar quando quiser?', a: 'Sim! Sem multa, sem burocracia. Cancele a qualquer momento direto pelo app.' },
              { q: 'O pagamento é seguro?', a: 'Totalmente. Usamos a plataforma Asaas com criptografia de ponta a ponta e certificação PCI-DSS.' },
              { q: 'Quais formas de pagamento?', a: 'PIX (aprovação instantânea), cartão de crédito e boleto bancário.' },
            ].map((faq, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="py-4 px-5">
                  <h3 className="font-semibold text-sm mb-1.5">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ====== PAYMENT METHODS ====== */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-4">
            Formas de pagamento aceitas
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {[
              { icon: QrCode, label: 'PIX', color: 'text-green-600' },
              { icon: CreditCard, label: 'Cartão de Crédito', color: 'text-blue-600' },
              { icon: FileText, label: 'Boleto', color: 'text-amber-600' },
            ].map((method, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <method.icon className={`h-5 w-5 ${method.color}`} />
                <span className="font-medium">{method.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-green-600" />
            <span>Ambiente 100% seguro</span>
            <span className="text-muted-foreground/30">·</span>
            <Lock className="h-3.5 w-3.5 text-green-600" />
            <span>Dados criptografados</span>
            <span className="text-muted-foreground/30">·</span>
            <BadgeCheck className="h-3.5 w-3.5 text-green-600" />
            <span>Asaas Pagamentos</span>
          </div>
        </div>
      </section>

      {/* ====== CTA FINAL ====== */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="overflow-hidden border-0">
            <div className="bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-8 md:p-12 text-center text-white">
              <Crown className="h-10 w-10 mx-auto mb-4 opacity-80" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Pronto para economizar?
              </h2>
              <p className="text-white/80 mb-6 max-w-md mx-auto">
                Junte-se a centenas de assinantes que já aproveitam benefícios exclusivos todos os dias.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" variant="secondary" className="font-semibold" asChild>
                  <a href="#plans">
                    <Zap className="h-4 w-4 mr-2" />
                    Ver Planos
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10 font-semibold" asChild>
                  <Link href="/cadastro">
                    Criar Conta Grátis
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="border-t bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <Crown className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-sm">UNICA Clube de Benefícios</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/termos" className="text-muted-foreground hover:text-foreground transition-colors">
                Termos
              </Link>
              <Link href="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacidade
              </Link>
              <Link href="/aviso-legal" className="text-muted-foreground hover:text-foreground transition-colors">
                Aviso Legal
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} UNICA. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
