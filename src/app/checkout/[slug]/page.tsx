'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { 
  Check, 
  Loader2, 
  CreditCard, 
  ArrowLeft,
  Calendar,
  CalendarDays,
  Infinity,
  Shield,
  Sparkles,
  Gift
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Benefit {
  id: string
  name: string
  type: string
  value: Record<string, unknown>
}

interface PlanBenefit {
  benefit: Benefit
}

interface Plan {
  id: string
  name: string
  description: string
  slug: string
  price: string | number
  priceMonthly: string | number | null
  priceYearly: string | number | null
  priceSingle: string | number | null
  planBenefits: PlanBenefit[]
}

type PaymentType = 'monthly' | 'yearly' | 'single'

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [paymentType, setPaymentType] = useState<PaymentType>('monthly')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
  })

  useEffect(() => {
    if (slug) {
      fetchPlan()
    }
  }, [slug])

  async function fetchPlan() {
    try {
      const response = await fetch(`/api/public/plans/${slug}`)
      
      if (response.status === 404) {
        setNotFound(true)
        return
      }

      if (response.ok) {
        const data = await response.json()
        setPlan(data)
        
        // Selecionar tipo de pagamento padrão baseado nos preços disponíveis
        if (data.priceMonthly) setPaymentType('monthly')
        else if (data.priceYearly) setPaymentType('yearly')
        else if (data.priceSingle) setPaymentType('single')
      } else {
        setNotFound(true)
      }
    } catch (error) {
      console.error('Erro ao carregar plano:', error)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  function formatPrice(price: string | number | null): string {
    if (!price) return 'R$ 0,00'
    const num = typeof price === 'string' ? parseFloat(price) : price
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function getSelectedPrice(): number {
    if (!plan) return 0
    
    switch (paymentType) {
      case 'monthly':
        return plan.priceMonthly ? Number(plan.priceMonthly) : Number(plan.price)
      case 'yearly':
        return plan.priceYearly ? Number(plan.priceYearly) : Number(plan.price) * 12
      case 'single':
        return plan.priceSingle ? Number(plan.priceSingle) : 0
      default:
        return Number(plan.price)
    }
  }

  function calculateYearlySavings(): number {
    if (!plan || !plan.priceYearly) return 0
    const monthlyTotal = (plan.priceMonthly ? Number(plan.priceMonthly) : Number(plan.price)) * 12
    const yearlyPrice = Number(plan.priceYearly)
    return monthlyTotal - yearlyPrice
  }

  function formatCPF(value: string): string {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  function formatPhone(value: string): string {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!plan) return

    // Validação básica
    if (!formData.name || !formData.email || !formData.phone || !formData.cpf) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (formData.cpf.replace(/\D/g, '').length !== 11) {
      toast.error('CPF inválido')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          planSlug: plan.slug,
          paymentType,
          amount: getSelectedPrice(),
          customer: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone.replace(/\D/g, ''),
            cpf: formData.cpf.replace(/\D/g, ''),
          },
        }),
      })

      const result = await response.json()

      if (response.ok && result.paymentUrl) {
        toast.success('Redirecionando para o Mercado Pago...')
        // Redirecionar para o Mercado Pago
        window.location.href = result.paymentUrl
      } else if (response.ok) {
        toast.error('Erro ao gerar link de pagamento')
        setSubmitting(false)
      } else {
        toast.error(result.error || 'Erro ao processar checkout')
        setSubmitting(false)
      }
    } catch (error) {
      console.error('Erro no checkout:', error)
      toast.error('Erro ao processar checkout. Tente novamente.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

  if (notFound || !plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Plano não encontrado</CardTitle>
            <CardDescription>
              O plano que você está procurando não existe ou não está mais disponível.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-gray-900 hover:bg-gray-800">
              <Link href="/planos">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ver planos disponíveis
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const yearlySavings = calculateYearlySavings()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/planos" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar aos planos</span>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="text-sm text-muted-foreground">Pagamento seguro</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Coluna do Plano */}
            <div className="space-y-6">
              {/* Info do Plano */}
              <Card className="border-gray-200 bg-gradient-to-br from-white to-gray-50/50">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-gray-700" />
                    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                      Plano Selecionado
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl text-gray-900">{plan.name}</CardTitle>
                  <CardDescription className="text-base">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Benefícios incluídos:
                    </p>
                    <ul className="space-y-2">
                      {plan.planBenefits.map((pb) => (
                        <li key={pb.benefit.id} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>{pb.benefit.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Opções de Pagamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Escolha o período</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Mensal */}
                  {(plan.priceMonthly || plan.price) && (
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentType === 'monthly'
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      onClick={() => setPaymentType('monthly')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-gray-700" />
                          <div>
                            <p className="font-semibold">Mensal</p>
                            <p className="text-sm text-muted-foreground">Cobrado todo mês</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {formatPrice(plan.priceMonthly || plan.price)}
                          </p>
                          <p className="text-xs text-muted-foreground">/mês</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Anual */}
                  {plan.priceYearly && (
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative overflow-hidden ${
                        paymentType === 'yearly'
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      onClick={() => setPaymentType('yearly')}
                    >
                      {yearlySavings > 0 && (
                        <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-lg font-semibold">
                          Economize {formatPrice(yearlySavings)}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CalendarDays className="h-5 w-5 text-gray-700" />
                          <div>
                            <p className="font-semibold">Anual</p>
                            <p className="text-sm text-muted-foreground">Cobrado uma vez por ano</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {formatPrice(plan.priceYearly)}
                          </p>
                          <p className="text-xs text-muted-foreground">/ano</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Único/Vitalício */}
                  {plan.priceSingle && (
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentType === 'single'
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      onClick={() => setPaymentType('single')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Infinity className="h-5 w-5 text-gray-700" />
                          <div>
                            <p className="font-semibold">Vitalício</p>
                            <p className="text-sm text-muted-foreground">Pague uma vez, use para sempre</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {formatPrice(plan.priceSingle)}
                          </p>
                          <p className="text-xs text-muted-foreground">único</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coluna do Formulário */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Finalizar Compra
                  </CardTitle>
                  <CardDescription>
                    Preencha seus dados para continuar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo *</Label>
                      <Input
                        id="name"
                        placeholder="Seu nome completo"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone *</Label>
                        <Input
                          id="phone"
                          placeholder="(00) 00000-0000"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                          maxLength={15}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          placeholder="000.000.000-00"
                          value={formData.cpf}
                          onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                          maxLength={14}
                          required
                        />
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Resumo */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Plano {plan.name}</span>
                        <span>
                          {paymentType === 'monthly' && 'Mensal'}
                          {paymentType === 'yearly' && 'Anual'}
                          {paymentType === 'single' && 'Vitalício'}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-gray-900">{formatPrice(getSelectedPrice())}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gray-900 hover:bg-gray-800 h-12 text-lg"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Pagar com Mercado Pago
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Ao clicar em pagar, você será redirecionado para o Mercado Pago
                      para concluir sua compra de forma segura.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
