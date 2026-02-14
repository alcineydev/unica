'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Crown, Check, ArrowRight, Shield, Zap, Star,
  Gift, Percent, Sparkles, Lock, CreditCard,
  QrCode, FileText, ArrowLeft, Store,
  BadgeCheck, Heart, ChevronRight, Loader2
} from 'lucide-react'

interface Plan {
  id: string
  name: string
  slug: string | null
  description: string | null
  price: number
  period: string
  features: string[]
  benefits?: { id: string; name: string; type: string; description: string | null }[]
  planBenefits?: { benefit: { id: string; name: string; type: string; description: string | null } }[]
}

export default function PlanosPublicPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPlans() }, [])

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans/public')
      if (!res.ok) throw new Error('Erro')
      const data = await res.json()
      const list = data.plans || (Array.isArray(data) ? data : data.data || [])
      // Filtrar apenas planos ativos E com preço > 0 (sem grátis)
      setPlans(list.filter((p: Plan & { isActive?: boolean }) => p.isActive !== false && Number(p.price) > 0))
    } catch (err) {
      console.error('Erro ao carregar planos:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPlanUrl = (plan: Plan) => `/checkout/${plan.slug || plan.id}`
  const periodLabel = (p: string) => p === 'YEARLY' ? '/ano' : p === 'SINGLE' ? ' único' : '/mês'

  const getBenefits = (plan: Plan) => {
    if (plan.planBenefits?.length) return plan.planBenefits.map(pb => pb.benefit)
    if (plan.benefits?.length) return plan.benefits
    return []
  }

  const highlightIndex = plans.length >= 2 ? plans.length - 1 : -1

  return (
    <div className="min-h-screen bg-white">

      {/* HEADER */}
      <header className="border-b bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg leading-none tracking-tight">UNICA</span>
              <span className="text-[10px] text-muted-foreground block leading-tight">Clube de Benefícios</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">
                <ArrowLeft className="h-4 w-4 mr-1" /> Entrar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-blue-200/40 to-blue-100/40 rounded-full blur-3xl -mt-48" />

        <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-8 md:pt-28 md:pb-12 text-center">
          <div className="inline-flex items-center gap-1.5 mb-6 px-4 py-1.5 text-sm bg-blue-50 text-primary border border-blue-200 rounded-full">
            <Sparkles className="h-3.5 w-3.5" />
            Clube de Benefícios
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-gray-900">
            Economize em tudo{' '}
            <span className="text-primary">com um só cartão</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8">
            Descontos exclusivos, cashback e pontos em centenas de parceiros da sua cidade.
            Escolha seu plano e comece a economizar hoje mesmo.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            {['Sem taxa de adesão', 'Cancele quando quiser', 'Ativação imediata'].map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-500" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center pb-6">
          <a href="#planos" className="animate-bounce text-gray-300" aria-label="Ver planos">
            <ChevronRight className="h-5 w-5 rotate-90" />
          </a>
        </div>
      </section>

      {/* PLANS */}
      <section className="px-4 py-16 md:py-20" id="planos">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Escolha o plano ideal para você</h2>
            <p className="text-gray-500">Todos os planos incluem acesso ao app e cartão digital</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-20">
              <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">Nenhum plano disponível</h3>
              <p className="text-sm text-gray-400 mb-4">Estamos preparando novos planos. Volte em breve!</p>
              <Button variant="outline" asChild><Link href="/">Voltar</Link></Button>
            </div>
          ) : (
            <div className={`grid gap-8 items-start ${
              plans.length === 1 ? 'max-w-sm mx-auto' :
              plans.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' :
              'lg:grid-cols-3 max-w-5xl mx-auto'
            }`}>
              {plans.map((plan, index) => {
                const price = Number(plan.price)
                const isHighlight = index === highlightIndex
                const benefits = getBenefits(plan)
                const features = plan.features || []

                return (
                  <div key={plan.id} className={`relative rounded-2xl transition-all duration-300 ${isHighlight ? 'md:-mt-4 md:mb-4' : ''}`}>
                    {isHighlight && <div className="absolute -inset-0.5 bg-gradient-to-b from-primary to-blue-700 rounded-2xl" />}

                    <div className={`relative bg-white rounded-2xl overflow-hidden ${
                      isHighlight
                        ? 'shadow-2xl shadow-blue-200/50'
                        : 'border border-gray-200 shadow-sm hover:shadow-lg hover:border-primary/40'
                    }`}>
                      {isHighlight && (
                        <div className="bg-primary text-white text-center py-2.5 text-xs font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-1.5">
                          <Star className="h-3.5 w-3.5 fill-white" /> Mais Popular
                        </div>
                      )}

                      <div className="p-6 md:p-8">
                        <div className="mb-6">
                          <h3 className="text-xl font-bold">{plan.name}</h3>
                          {plan.description && <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{plan.description}</p>}
                        </div>

                        <div className="mb-8">
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-lg font-semibold text-gray-400">R$</span>
                            <span className="text-5xl font-extrabold tracking-tight">{price.toFixed(2).replace('.', ',')}</span>
                            <span className="text-base text-gray-400 ml-1">{periodLabel(plan.period)}</span>
                          </div>
                          {plan.period === 'MONTHLY' && <p className="text-xs text-gray-400 mt-1.5">Cobrado mensalmente · Cancele quando quiser</p>}
                          {plan.period === 'YEARLY' && <p className="text-xs text-gray-400 mt-1.5">Cobrado anualmente · Economia de até 20%</p>}
                        </div>

                        <Button
                          className={`w-full h-12 text-base font-semibold rounded-xl ${
                            isHighlight ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-blue-200/50' : ''
                          }`}
                          variant={isHighlight ? 'default' : 'outline'}
                          asChild
                        >
                          <Link href={getPlanUrl(plan)}>
                            Assinar {plan.name} <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>

                        <Separator className="my-6" />

                        <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">O que está incluso</p>

                          {features.map((f, i) => (
                            <div key={`f-${i}`} className="flex items-start gap-3">
                              <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Check className="h-3 w-3 text-green-600" />
                              </div>
                              <span className="text-sm text-gray-600 leading-snug">{f}</span>
                            </div>
                          ))}

                          {features.length === 0 && benefits.length > 0 && benefits.map((b, i) => (
                            <div key={`b-${i}`} className="flex items-start gap-3">
                              <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Check className="h-3 w-3 text-green-600" />
                              </div>
                              <span className="text-sm text-gray-600 leading-snug">{b.name}</span>
                            </div>
                          ))}

                          {features.length > 0 && benefits.length > 0 && (
                            <>
                              <Separator className="my-3" />
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Benefícios</p>
                              {benefits.slice(0, 5).map((b, i) => (
                                <div key={`bp-${i}`} className="flex items-center gap-3">
                                  <Gift className="h-4 w-4 text-primary shrink-0" />
                                  <span className="text-sm text-gray-600">{b.name}</span>
                                </div>
                              ))}
                              {benefits.length > 5 && <p className="text-xs text-primary font-semibold pl-7">+{benefits.length - 5} benefício{benefits.length - 5 > 1 ? 's' : ''}</p>}
                            </>
                          )}

                          {features.length === 0 && benefits.length === 0 && (
                            ['Acesso ao app', 'Cartão digital QR Code', 'Suporte via WhatsApp'].map((item, i) => (
                              <div key={`d-${i}`} className="flex items-start gap-3">
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                  <Check className="h-3 w-3 text-green-600" />
                                </div>
                                <span className="text-sm text-gray-600 leading-snug">{item}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 md:py-20 bg-gray-50 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Como funciona?</h2>
            <p className="text-gray-500">3 passos simples para começar a economizar</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              { step: '01', icon: Crown, title: 'Escolha seu plano', desc: 'Selecione o plano ideal e pague com PIX, cartão ou boleto.' },
              { step: '02', icon: QrCode, title: 'Receba seu cartão', desc: 'Acesse o app e use seu QR Code digital nos parceiros.' },
              { step: '03', icon: Percent, title: 'Economize sempre', desc: 'Apresente seu cartão e aproveite descontos e cashback.' },
            ].map((item, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <span className="text-5xl font-black text-blue-100 leading-none">{item.step}</span>
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY UNICA */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Por que escolher o UNICA?</h2>
            <p className="text-gray-500">Vantagens reais que fazem diferença no seu dia a dia</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Store, title: 'Parceiros locais', desc: 'Dezenas de estabelecimentos parceiros na sua região', color: 'bg-blue-50 text-blue-600' },
              { icon: Percent, title: 'Descontos reais', desc: 'Economia de verdade que você sente no bolso', color: 'bg-green-50 text-green-600' },
              { icon: Gift, title: 'Cashback', desc: 'Receba parte do valor de volta a cada compra', color: 'bg-amber-50 text-amber-600' },
              { icon: Heart, title: 'Exclusividade', desc: 'Acesso a promoções e eventos especiais do clube', color: 'bg-rose-50 text-rose-600' },
            ].map((item, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:border-primary/30 transition-all">
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-4`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-gray-50 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Dúvidas frequentes</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'Como funciona o clube?', a: 'Ao assinar, você recebe um cartão digital (QR Code) no app que dá acesso a descontos em parceiros da sua cidade.' },
              { q: 'Como uso meus benefícios?', a: 'Apresente seu QR Code nos parceiros. O desconto é aplicado na hora!' },
              { q: 'Posso cancelar quando quiser?', a: 'Sim! Sem multa, sem burocracia. Cancele pelo app.' },
              { q: 'O pagamento é seguro?', a: 'Totalmente. Processamos via Asaas com criptografia e certificação PCI-DSS.' },
              { q: 'Quais formas de pagamento?', a: 'PIX (instantâneo), cartão de crédito e boleto bancário.' },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="font-semibold text-sm mb-1.5">{faq.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAYMENT METHODS */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-gray-400 uppercase tracking-[0.15em] font-bold mb-5">Formas de pagamento</p>
          <div className="flex flex-wrap items-center justify-center gap-8 mb-4">
            {[
              { icon: QrCode, label: 'PIX', sub: 'Instantâneo', color: 'text-green-600 bg-green-50' },
              { icon: CreditCard, label: 'Cartão', sub: 'Crédito', color: 'text-blue-600 bg-blue-50' },
              { icon: FileText, label: 'Boleto', sub: 'Bancário', color: 'text-amber-600 bg-amber-50' },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${m.color} flex items-center justify-center`}>
                  <m.icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-700">{m.label}</p>
                  <p className="text-xs text-gray-400">{m.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-green-500" /><span>100% seguro</span></div>
            <span className="text-gray-200">&middot;</span>
            <div className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-green-500" /><span>Criptografado</span></div>
            <span className="text-gray-200">&middot;</span>
            <div className="flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5 text-green-500" /><span>Asaas</span></div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-700 to-primary p-8 md:p-14 text-center">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mt-20 -mr-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -mb-16 -ml-16" />
            <div className="relative">
              <Crown className="h-10 w-10 mx-auto mb-5 text-white/80" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">Pronto para economizar?</h2>
              <p className="text-blue-200 mb-8 max-w-md mx-auto leading-relaxed">
                Junte-se a centenas de assinantes que já aproveitam benefícios exclusivos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="bg-white text-primary hover:bg-blue-50 font-semibold shadow-lg h-12 px-8" asChild>
                  <a href="#planos"><Zap className="h-4 w-4 mr-2" /> Ver Planos</a>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold h-12 px-8 bg-transparent" asChild>
                  <Link href="/login">Já tenho conta</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <Crown className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-semibold text-sm text-gray-700">UNICA Clube de Benefícios</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/termos" className="text-gray-400 hover:text-gray-700 transition-colors">Termos</Link>
              <Link href="/privacidade" className="text-gray-400 hover:text-gray-700 transition-colors">Privacidade</Link>
              <Link href="/aviso-legal" className="text-gray-400 hover:text-gray-700 transition-colors">Aviso Legal</Link>
            </div>
            <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} UNICA. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
