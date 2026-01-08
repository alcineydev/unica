'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, CreditCard, QrCode, FileText, CheckCircle, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
  id: string
  name: string
  price: number
  priceMonthly: number | null
  period: string
  description: string | null
}

interface PixData {
  encodedImage: string
  payload: string
  expirationDate: string
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.planId as string

  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [billingType, setBillingType] = useState<'PIX' | 'BOLETO' | 'CREDIT_CARD'>('PIX')
  const [paymentCreated, setPaymentCreated] = useState(false)
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [bankSlipUrl, setBankSlipUrl] = useState<string | null>(null)

  // Dados do cartão
  const [creditCard, setCreditCard] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
  })

  const [holderInfo, setHolderInfo] = useState({
    name: '',
    email: '',
    cpfCnpj: '',
    postalCode: '',
    addressNumber: '',
    phone: '',
  })

  useEffect(() => {
    fetchPlan()
  }, [planId])

  async function fetchPlan() {
    try {
      const res = await fetch(`/api/plans/${planId}`)
      if (res.ok) {
        const data = await res.json()
        setPlan(data)
      } else {
        toast.error('Plano não encontrado')
        router.push('/app/planos')
      }
    } catch {
      toast.error('Erro ao carregar plano')
    } finally {
      setLoading(false)
    }
  }

  async function handlePayment() {
    setProcessing(true)
    try {
      const body: Record<string, unknown> = {
        planId,
        billingType,
      }

      if (billingType === 'CREDIT_CARD') {
        body.creditCard = creditCard
        body.creditCardHolderInfo = holderInfo
      }

      const res = await fetch('/api/asaas/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar pagamento')
      }

      if (billingType === 'PIX' && data.pixData) {
        setPixData(data.pixData)
        setPaymentCreated(true)
      } else if (billingType === 'BOLETO' && data.payment?.bankSlipUrl) {
        setBankSlipUrl(data.payment.bankSlipUrl)
        setPaymentCreated(true)
      } else if (billingType === 'CREDIT_CARD') {
        toast.success('Pagamento processado com sucesso!')
        router.push('/app?payment=success')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao processar pagamento')
    } finally {
      setProcessing(false)
    }
  }

  function copyPixCode() {
    if (pixData?.payload) {
      navigator.clipboard.writeText(pixData.payload)
      toast.success('Código Pix copiado!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!plan) {
    return null
  }

  const value = plan.priceMonthly || plan.price

  // Tela de pagamento criado (Pix ou Boleto)
  if (paymentCreated) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle>Pagamento Gerado!</CardTitle>
            <CardDescription>
              {billingType === 'PIX'
                ? 'Escaneie o QR Code ou copie o código Pix'
                : 'Clique no botão para visualizar o boleto'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {billingType === 'PIX' && pixData && (
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img
                    src={`data:image/png;base64,${pixData.encodedImage}`}
                    alt="QR Code Pix"
                    className="w-64 h-64 mx-auto"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Código Pix Copia e Cola:</p>
                  <div className="flex gap-2">
                    <Input
                      value={pixData.payload}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button onClick={copyPixCode} variant="outline">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {billingType === 'BOLETO' && bankSlipUrl && (
              <div className="text-center">
                <Button asChild size="lg">
                  <a href={bankSlipUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-5 w-5" />
                    Visualizar Boleto
                  </a>
                </Button>
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground">
              <p>Valor: R$ {value.toFixed(2)}</p>
              <p>Plano: {plan.name}</p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => router.push('/app')}>
                Voltar ao Início
              </Button>
              <Button onClick={() => router.push('/app/minha-assinatura')}>
                Ver Minha Assinatura
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Resumo do Plano */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              R$ {value.toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground">
                /{plan.period === 'MONTHLY' || plan.period === 'MENSAL' ? 'mês' : plan.period}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Pagamento */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={billingType}
              onValueChange={(v) => setBillingType(v as 'PIX' | 'BOLETO' | 'CREDIT_CARD')}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="PIX" id="pix" className="peer sr-only" />
                <Label
                  htmlFor="pix"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  <QrCode className="mb-2 h-6 w-6" />
                  Pix
                </Label>
              </div>
              <div>
                <RadioGroupItem value="BOLETO" id="boleto" className="peer sr-only" />
                <Label
                  htmlFor="boleto"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  <FileText className="mb-2 h-6 w-6" />
                  Boleto
                </Label>
              </div>
              <div>
                <RadioGroupItem value="CREDIT_CARD" id="card" className="peer sr-only" />
                <Label
                  htmlFor="card"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  <CreditCard className="mb-2 h-6 w-6" />
                  Cartão
                </Label>
              </div>
            </RadioGroup>

            {billingType === 'CREDIT_CARD' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nome no Cartão</Label>
                    <Input
                      value={creditCard.holderName}
                      onChange={(e) => setCreditCard({ ...creditCard, holderName: e.target.value })}
                      placeholder="Como está no cartão"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Número do Cartão</Label>
                    <Input
                      value={creditCard.number}
                      onChange={(e) => setCreditCard({ ...creditCard, number: e.target.value.replace(/\D/g, '') })}
                      placeholder="0000 0000 0000 0000"
                      maxLength={16}
                    />
                  </div>
                  <div>
                    <Label>Mês</Label>
                    <Input
                      value={creditCard.expiryMonth}
                      onChange={(e) => setCreditCard({ ...creditCard, expiryMonth: e.target.value })}
                      placeholder="MM"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label>Ano</Label>
                    <Input
                      value={creditCard.expiryYear}
                      onChange={(e) => setCreditCard({ ...creditCard, expiryYear: e.target.value })}
                      placeholder="AAAA"
                      maxLength={4}
                    />
                  </div>
                  <div>
                    <Label>CVV</Label>
                    <Input
                      value={creditCard.ccv}
                      onChange={(e) => setCreditCard({ ...creditCard, ccv: e.target.value })}
                      placeholder="000"
                      maxLength={4}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3">Dados do Titular</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Nome Completo</Label>
                      <Input
                        value={holderInfo.name}
                        onChange={(e) => setHolderInfo({ ...holderInfo, name: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={holderInfo.email}
                        onChange={(e) => setHolderInfo({ ...holderInfo, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>CPF/CNPJ</Label>
                      <Input
                        value={holderInfo.cpfCnpj}
                        onChange={(e) => setHolderInfo({ ...holderInfo, cpfCnpj: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input
                        value={holderInfo.phone}
                        onChange={(e) => setHolderInfo({ ...holderInfo, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>CEP</Label>
                      <Input
                        value={holderInfo.postalCode}
                        onChange={(e) => setHolderInfo({ ...holderInfo, postalCode: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Número</Label>
                      <Input
                        value={holderInfo.addressNumber}
                        onChange={(e) => setHolderInfo({ ...holderInfo, addressNumber: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handlePayment}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                `Pagar R$ ${value.toFixed(2)}`
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
