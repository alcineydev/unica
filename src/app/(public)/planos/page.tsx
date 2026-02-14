'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Crown, Check, ArrowRight, Shield, Zap, Star,
  Gift, Percent, Sparkles, Lock, CreditCard,
  QrCode, FileText, ArrowLeft, Store,
  BadgeCheck, Heart, ChevronDown, Loader2, Users
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
    <div className="min-h-screen bg-[#f8fafc]">

      {/* ===== HEADER ===== */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md shadow-blue-200/60 group-hover:shadow-lg group-hover:shadow-blue-200/80 transition-shadow">
              <span className="text-white font-extrabold text-sm">U</span>
            </div>
            <div>
              <span className="font-bold text-[17px] leading-none tracking-tight text-gray-900">UNICA</span>
              <span className="text-[10px] text-gray-400 block leading-tight tracking-wide">Clube de Benefícios</span>
            </div>
          </Link>
          <Button variant="outline" size="sm" className="font-medium border-gray-200 text-gray-600 hover:text-primary hover:border-primary/40" asChild>
            <Link href="/login">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Entrar
            </Link>
          </Button>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMkgydjJoMzR6TTIgMzR2LTJoMzR2MkgyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#f8fafc] to-transparent" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
          <div className="inline-flex items-center gap-1.5 mb-6 px-3 py-1 text-xs font-semibold bg-white/15 backdrop-blur-sm text-white/90 rounded-full border border-white/20">
            <Sparkles className="h-3 w-3" />
            Clube de Benefícios da sua cidade
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-extrabold tracking-tight mb-5 text-white leading-[1.1]">
            Economize de verdade<br className="hidden sm:block" />
            <span className="text-blue-200">em cada compra</span>
          </h1>

          <p className="text-base sm:text-lg text-blue-100/80 max-w-xl mx-auto leading-relaxed mb-10">
            Descontos, cashback e benefícios exclusivos nos melhores parceiros da sua região. Assine e comece a economizar.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-blue-200/70">
            {['Sem taxa de adesão', 'Cancele quando quiser', 'Ativação imediata'].map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-green-400/20 flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-green-300" />
                </div>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLANS ===== */}
      <section className="px-4 sm:px-6 -mt-6 pb-16 md:pb-20 relative z-10" id="planos">
        <div className="max-w-4xl mx-auto">

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
              <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">Nenhum plano disponível</h3>
              <p className="text-sm text-gray-400 mb-4">Estamos preparando novos planos.</p>
              <Button variant="outline" asChild><Link href="/">Voltar</Link></Button>
            </div>
          ) : (
            <div className={`grid gap-6 items-start ${
              plans.length === 1 ? 'max-w-md mx-auto' :
              plans.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' :
              'lg:grid-cols-3 max-w-5xl mx-auto'
            }`}>
              {plans.map((plan, index) => {
                const price = Number(plan.price)
                const isHighlight = index === highlightIndex
                const benefits = getBenefits(plan)
                const features = plan.features || []
                const allItems = features.length > 0 ? features : benefits.map(b => b.name)
                const fallbackItems = allItems.length === 0 ? ['Acesso ao app', 'Cartão digital QR Code', 'Suporte via WhatsApp'] : []

                return (
                  <div key={plan.id} className="relative group">
                    {/* Glow para destaque */}
                    {isHighlight && (
                      <div className="absolute -inset-[2px] bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 rounded-[20px] shadow-xl shadow-blue-200/40" />
                    )}

                    <div className={`relative bg-white rounded-[18px] overflow-hidden transition-all duration-300 ${
                      isHighlight
                        ? 'shadow-none'
                        : 'border border-gray-200/80 shadow-sm hover:shadow-xl hover:shadow-gray-200/60 hover:-translate-y-1'
                    }`}>
                      {/* Popular ribbon */}
                      {isHighlight && (
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-2 text-[11px] font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-1.5">
                          <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                          Mais Popular
                          <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                        </div>
                      )}

                      <div className="p-6 sm:p-7">
                        {/* Header */}
                        <div className="mb-5">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isHighlight ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <Crown className="h-4 w-4" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                          </div>
                          {plan.description && (
                            <p className="text-[13px] text-gray-400 leading-relaxed line-clamp-2 pl-10">{plan.description}</p>
                          )}
                        </div>

                        {/* Price */}
                        <div className={`rounded-xl p-4 mb-6 ${isHighlight ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-medium text-gray-400">R$</span>
                            <span className={`text-4xl font-extrabold tracking-tight ${isHighlight ? 'text-blue-700' : 'text-gray-900'}`}>
                              {price.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-sm text-gray-400 ml-0.5">{periodLabel(plan.period)}</span>
                          </div>
                          {plan.period === 'MONTHLY' && <p className="text-[11px] text-gray-400 mt-1">Cobrado mensalmente</p>}
                          {plan.period === 'YEARLY' && <p className="text-[11px] text-green-600 font-medium mt-1">Economia de até 20%</p>}
                        </div>

                        {/* CTA */}
                        <Button
                          className={`w-full h-11 text-sm font-semibold rounded-xl transition-all ${
                            isHighlight
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200/50 hover:shadow-lg hover:shadow-blue-200/60'
                              : 'bg-gray-900 hover:bg-gray-800 text-white'
                          }`}
                          asChild
                        >
                          <Link href={getPlanUrl(plan)}>
                            Assinar {plan.name} <ArrowRight className="h-4 w-4 ml-1.5" />
                          </Link>
                        </Button>

                        {/* Features */}
                        <div className="mt-6 space-y-2.5">
                          <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-[0.12em]">Incluso no plano</p>

                          {[...allItems, ...fallbackItems].map((item, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <div className="mt-0.5 w-4 h-4 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                <Check className="h-2.5 w-2.5 text-green-500" />
                              </div>
                              <span className="text-[13px] text-gray-500 leading-snug">{item}</span>
                            </div>
                          ))}

                          {/* Benefícios adicionais quando tem features + benefits */}
                          {features.length > 0 && benefits.length > 0 && (
                            <>
                              <div className="pt-2 mt-2 border-t border-gray-100">
                                <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-[0.12em] mb-2.5">Benefícios</p>
                                {benefits.slice(0, 4).map((b, i) => (
                                  <div key={`b-${i}`} className="flex items-center gap-2.5 mb-2">
                                    <Gift className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                    <span className="text-[13px] text-gray-500">{b.name}</span>
                                  </div>
                                ))}
                                {benefits.length > 4 && (
                                  <p className="text-[11px] text-blue-500 font-semibold pl-6">+{benefits.length - 4} mais</p>
                                )}
                              </div>
                            </>
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

      {/* ===== COMO FUNCIONA ===== */}
      <section className="py-16 md:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] mb-2">Simples e rápido</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Como funciona?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { num: '01', icon: CreditCard, title: 'Assine seu plano', desc: 'Escolha o plano ideal e pague com PIX, cartão ou boleto.' },
              { num: '02', icon: QrCode, title: 'Receba seu QR Code', desc: 'Acesse o app e use seu cartão digital nos parceiros.' },
              { num: '03', icon: Percent, title: 'Economize sempre', desc: 'Apresente seu QR Code e ganhe descontos e cashback.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-5">
                  <div className="absolute inset-0 bg-blue-100 rounded-2xl rotate-6" />
                  <div className="relative w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                    <item.icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-blue-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {item.num}
                  </span>
                </div>
                <h3 className="font-bold text-[15px] mb-1.5 text-gray-900">{item.title}</h3>
                <p className="text-[13px] text-gray-400 leading-relaxed max-w-[220px] mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== VANTAGENS ===== */}
      <section className="py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] mb-2">Benefícios exclusivos</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Por que escolher o UNICA?</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Store, title: 'Parceiros locais', desc: 'Dezenas de estabelecimentos parceiros na sua região', bg: 'bg-blue-50', iconColor: 'text-blue-600' },
              { icon: Percent, title: 'Descontos reais', desc: 'Economia de verdade que você sente no bolso', bg: 'bg-green-50', iconColor: 'text-green-600' },
              { icon: Gift, title: 'Cashback', desc: 'Receba parte do valor de volta a cada compra', bg: 'bg-amber-50', iconColor: 'text-amber-600' },
              { icon: Heart, title: 'Exclusividade', desc: 'Promoções e eventos especiais só para membros', bg: 'bg-rose-50', iconColor: 'text-rose-600' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl bg-white border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all">
                <div className={`w-11 h-11 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-[14px] text-gray-900 mb-0.5">{item.title}</h3>
                  <p className="text-[13px] text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 md:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'Como funciona o clube?', a: 'Ao assinar, você recebe um cartão digital (QR Code) no app que dá acesso a descontos em parceiros da sua cidade.' },
              { q: 'Como uso meus benefícios?', a: 'Apresente seu QR Code nos parceiros. O desconto é aplicado na hora!' },
              { q: 'Posso cancelar quando quiser?', a: 'Sim! Sem multa e sem burocracia. Cancele direto pelo app.' },
              { q: 'O pagamento é seguro?', a: 'Totalmente. Processamos via Asaas com criptografia PCI-DSS.' },
              { q: 'Quais formas de pagamento?', a: 'PIX (instantâneo), cartão de crédito e boleto bancário.' },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors">
                <h3 className="font-semibold text-[13px] text-gray-800 mb-1">{faq.q}</h3>
                <p className="text-[13px] text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PAGAMENTO ===== */}
      <section className="py-10 px-4">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-6">
          {[
            { icon: QrCode, label: 'PIX', color: 'text-green-600' },
            { icon: CreditCard, label: 'Cartão', color: 'text-blue-600' },
            { icon: FileText, label: 'Boleto', color: 'text-amber-600' },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
              <m.icon className={`h-4 w-4 ${m.color}`} />
              <span>{m.label}</span>
            </div>
          ))}
          <span className="text-gray-200">|</span>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Shield className="h-3.5 w-3.5 text-green-500" />
            <span>Pagamento seguro &middot; Asaas</span>
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-2xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 md:p-12 text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mt-32 -mr-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mb-24 -ml-24" />
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">Pronto para economizar?</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto text-[15px] leading-relaxed">
                Junte-se a centenas de assinantes aproveitando benefícios exclusivos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 px-8 rounded-xl shadow-lg shadow-blue-500/25" asChild>
                  <a href="#planos"><Zap className="h-4 w-4 mr-2" /> Ver Planos</a>
                </Button>
                <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white font-medium h-11 px-8 rounded-xl bg-transparent" asChild>
                  <Link href="/login">Já tenho conta</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-gray-400">&copy; {new Date().getFullYear()} UNICA Clube de Benefícios</span>
            <div className="flex gap-5 text-xs">
              <Link href="/termos" className="text-gray-400 hover:text-gray-600 transition-colors">Termos</Link>
              <Link href="/privacidade" className="text-gray-400 hover:text-gray-600 transition-colors">Privacidade</Link>
              <Link href="/aviso-legal" className="text-gray-400 hover:text-gray-600 transition-colors">Aviso Legal</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
