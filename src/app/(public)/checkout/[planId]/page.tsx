'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

import CheckoutStepper from './components/checkout-stepper'
import CheckoutPlanSummary from './components/checkout-plan-summary'
import CheckoutPersonalForm from './components/checkout-personal-form'
import CheckoutAddressForm from './components/checkout-address-form'
import CheckoutPaymentForm from './components/checkout-payment-form'
import CheckoutPixResult from './components/checkout-pix-result'
import CheckoutBoletoResult from './components/checkout-boleto-result'

type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  period: string
  slug: string
  features: string[]
  planBenefits: Array<{ benefit?: { name?: string } }>
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.planId as string

  // Estado geral
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState(0) // 0: dados, 1: endereço, 2: pagamento
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [paymentResult, setPaymentResult] = useState<any>(null)

  // Dados do formulário
  const [personalData, setPersonalData] = useState({
    name: '', email: '', cpfCnpj: '', phone: '',
  })
  const [addressData, setAddressData] = useState({
    cep: '', street: '', number: '', complement: '',
    neighborhood: '', city: '', state: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX')
  const [cardData, setCardData] = useState({
    holderName: '', number: '', expiry: '', cvv: '',
  })
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  // Carregar plano
  const fetchPlan = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/plans/public/${planId}`)
      if (!res.ok) throw new Error('Plano não encontrado')
      const data = await res.json()
      setPlan(data.plan || data.data || data)
    } catch {
      toast.error('Plano não encontrado')
    } finally {
      setLoading(false)
    }
  }, [planId])

  useEffect(() => {
    if (planId) fetchPlan()
  }, [planId, fetchPlan])

  // Processar pagamento
  const handlePayment = async () => {
    setProcessing(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        planId: plan?.id,
        customer: {
          name: personalData.name,
          email: personalData.email,
          cpfCnpj: personalData.cpfCnpj.replace(/\D/g, ''),
          phone: personalData.phone.replace(/\D/g, ''),
          postalCode: addressData.cep.replace(/\D/g, ''),
          address: addressData.street,
          addressNumber: addressData.number,
          complement: addressData.complement || undefined,
          province: addressData.neighborhood,
          city: addressData.city,
          state: addressData.state,
        },
        billingType: paymentMethod,
      }

      // Se cartão, tokenizar primeiro
      if (paymentMethod === 'CREDIT_CARD') {
        const tokenRes = await fetch('/api/checkout/asaas/tokenize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: payload.customer,
            creditCard: {
              holderName: cardData.holderName,
              number: cardData.number.replace(/\s/g, ''),
              expiryMonth: cardData.expiry.slice(0, 2),
              expiryYear: `20${cardData.expiry.slice(2)}`,
              ccv: cardData.cvv,
            },
            creditCardHolderInfo: {
              name: personalData.name,
              email: personalData.email,
              cpfCnpj: personalData.cpfCnpj.replace(/\D/g, ''),
              phone: personalData.phone.replace(/\D/g, ''),
              postalCode: addressData.cep.replace(/\D/g, ''),
              addressNumber: addressData.number,
              address: addressData.street,
              province: addressData.neighborhood,
            },
          }),
        })

        if (!tokenRes.ok) {
          const err = await tokenRes.json()
          throw new Error(err.error || 'Erro ao tokenizar cartão')
        }

        const tokenData = await tokenRes.json()
        payload.creditCardToken = tokenData.creditCardToken
        payload.creditCardHolderInfo = {
          name: personalData.name,
          email: personalData.email,
          cpfCnpj: personalData.cpfCnpj.replace(/\D/g, ''),
          phone: personalData.phone.replace(/\D/g, ''),
          postalCode: addressData.cep.replace(/\D/g, ''),
          addressNumber: addressData.number,
          address: addressData.street,
          province: addressData.neighborhood,
        }
      }

      // Criar cobrança
      const res = await fetch('/api/checkout/asaas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || err.message || 'Erro ao processar pagamento')
      }

      const result = await res.json()
      setPaymentResult(result)

      if (paymentMethod === 'CREDIT_CARD' && (result.status === 'CONFIRMED' || result.status === 'RECEIVED')) {
        toast.success('Pagamento aprovado!')
        setTimeout(() => {
          router.push(`/checkout/sucesso?paymentId=${result.paymentId || result.id}`)
        }, 1500)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao processar pagamento'
      toast.error(message)
    } finally {
      setProcessing(false)
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <Skeleton className="h-96" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    )
  }

  // Plano não encontrado
  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-destructive opacity-60" />
            <h2 className="text-lg font-bold">Plano não encontrado</h2>
            <p className="text-sm text-muted-foreground mt-1">
              O plano selecionado não existe ou não está disponível.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/">Voltar ao início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Resultado do pagamento (PIX)
  if (paymentResult && paymentMethod === 'PIX') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
        <div className="max-w-lg mx-auto p-4 md:p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-bold">Pagamento PIX</h1>
            <p className="text-sm text-muted-foreground">{plan.name}</p>
          </div>
          <CheckoutPixResult
            pixData={{
              qrCodeImage: paymentResult.pixQrCode || paymentResult.qrCode?.encodedImage,
              qrCodeText: paymentResult.pixCopyPaste || paymentResult.qrCode?.payload,
              expirationDate: paymentResult.expirationDate,
            }}
            paymentId={paymentResult.paymentId || paymentResult.id}
            onConfirmed={() => {
              router.push(`/checkout/sucesso?paymentId=${paymentResult.paymentId || paymentResult.id}`)
            }}
          />
          <CheckoutPlanSummary plan={plan} />
        </div>
      </div>
    )
  }

  // Resultado do pagamento (Boleto)
  if (paymentResult && paymentMethod === 'BOLETO') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
        <div className="max-w-lg mx-auto p-4 md:p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-bold">Boleto Gerado</h1>
            <p className="text-sm text-muted-foreground">{plan.name}</p>
          </div>
          <CheckoutBoletoResult
            boletoData={{
              bankSlipUrl: paymentResult.bankSlipUrl,
              identificationField: paymentResult.identificationField,
              dueDate: paymentResult.dueDate,
            }}
          />
          <CheckoutPlanSummary plan={plan} />
        </div>
      </div>
    )
  }

  // Formulário de checkout (3 steps)
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => step > 0 ? setStep(step - 1) : router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Checkout</h1>
            <p className="text-sm text-muted-foreground">Finalize sua assinatura</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <CheckoutStepper currentStep={step} />
        </div>

        {/* Layout: Form + Sidebar */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Formulário */}
          <div>
            {step === 0 && (
              <CheckoutPersonalForm
                data={personalData}
                onChange={setPersonalData}
                onNext={() => setStep(1)}
                disabled={processing}
              />
            )}

            {step === 1 && (
              <CheckoutAddressForm
                data={addressData}
                onChange={setAddressData}
                onNext={() => setStep(2)}
                onBack={() => setStep(0)}
                disabled={processing}
              />
            )}

            {step === 2 && (
              <CheckoutPaymentForm
                selectedMethod={paymentMethod}
                onMethodChange={setPaymentMethod}
                cardData={cardData}
                onCardChange={setCardData}
                onSubmit={handlePayment}
                onBack={() => setStep(1)}
                loading={processing}
                planPrice={Number(plan.price)}
                acceptedTerms={acceptedTerms}
                onTermsChange={setAcceptedTerms}
              />
            )}
          </div>

          {/* Sidebar - Resumo do Plano */}
          <div className="order-first lg:order-last">
            <div className="lg:sticky lg:top-8">
              <CheckoutPlanSummary plan={plan} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
