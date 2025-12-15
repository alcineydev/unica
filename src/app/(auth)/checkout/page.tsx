'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  ArrowLeft, 
  CreditCard, 
  QrCode, 
  Gift,
  Shield,
  Check
} from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
  id: string
  name: string
  price: number
  yearlyPrice: number | null
}

function CheckoutForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plano')
  const userId = searchParams.get('user')

  const [plan, setPlan] = useState<Plan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentType, setPaymentType] = useState<'monthly' | 'yearly'>('monthly')
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix')

  useEffect(() => {
    if (planId) {
      fetchPlan()
    } else {
      router.push('/planos')
    }
  }, [planId])

  const fetchPlan = async () => {
    try {
      const response = await fetch(`/api/public/plans/${planId}`)
      const data = await response.json()
      if (data.plan) {
        setPlan(data.plan)
      }
    } catch (error) {
      console.error('Erro ao buscar plano:', error)
      toast.error('Erro ao carregar plano')
    } finally {
      setIsLoading(false)
    }
  }

  const getPrice = () => {
    if (!plan) return 0
    return paymentType === 'yearly' && plan.yearlyPrice 
      ? plan.yearlyPrice 
      : plan.price
  }

  const handleCheckout = async () => {
    setIsProcessing(true)

    try {
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          userId,
          paymentType,
          paymentMethod
        })
      })

      const data = await response.json()

      if (data.checkoutUrl) {
        // Redirecionar para o Mercado Pago
        window.location.href = data.checkoutUrl
      } else if (data.pixQrCode) {
        // Mostrar QR Code do PIX
        router.push(`/checkout/pix?code=${data.pixQrCode}&id=${data.paymentId}`)
      } else {
        toast.error(data.error || 'Erro ao processar pagamento')
      }
    } catch (error) {
      console.error('Erro no checkout:', error)
      toast.error('Erro ao processar pagamento')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p>Plano não encontrado</p>
            <Link href="/planos">
              <Button className="mt-4">Ver Planos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/planos" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Gift className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold">UNICA</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Resumo do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold text-lg">{plan.name}</p>
                <p className="text-sm text-muted-foreground">Clube de Benefícios</p>
              </div>

              {plan.yearlyPrice && (
                <div className="space-y-2">
                  <Label>Período</Label>
                  <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as 'monthly' | 'yearly')}>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="monthly" id="monthly" />
                      <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                        <span>Mensal</span>
                        <span className="float-right">{formatPrice(plan.price)}/mês</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg border-green-500 bg-green-50 dark:bg-green-950">
                      <RadioGroupItem value="yearly" id="yearly" />
                      <Label htmlFor="yearly" className="flex-1 cursor-pointer">
                        <span>Anual</span>
                        <span className="text-green-600 text-xs ml-2">Economize 2 meses</span>
                        <span className="float-right">{formatPrice(plan.yearlyPrice)}/ano</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(getPrice())}</span>
              </div>
            </CardContent>
          </Card>

          {/* Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Forma de Pagamento</CardTitle>
              <CardDescription>Escolha como deseja pagar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'pix' | 'card')}>
                <div 
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'pix' ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setPaymentMethod('pix')}
                >
                  <RadioGroupItem value="pix" id="pix" />
                  <QrCode className="h-6 w-6 text-teal-600" />
                  <Label htmlFor="pix" className="flex-1 cursor-pointer">
                    <span className="font-medium">PIX</span>
                    <span className="block text-sm text-muted-foreground">Aprovação instantânea</span>
                  </Label>
                </div>
                <div 
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'card' ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <RadioGroupItem value="card" id="card" />
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer">
                    <span className="font-medium">Cartão de Crédito</span>
                    <span className="block text-sm text-muted-foreground">Parcele em até 12x</span>
                  </Label>
                </div>
              </RadioGroup>

              <Button 
                className="w-full h-12 text-base" 
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Pagar {formatPrice(getPrice())}
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Pagamento 100% seguro via Mercado Pago</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefícios */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <p className="font-semibold mb-4">O que você vai receber:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Carteirinha digital com QR Code</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Descontos em centenas de parceiros</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Cashback em compras</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Acúmulo de pontos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutForm />
    </Suspense>
  )
}

