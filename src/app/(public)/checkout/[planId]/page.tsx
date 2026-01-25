'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  CreditCard, 
  QrCode, 
  FileText, 
  Check, 
  Shield, 
  Clock,
  Copy,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Smartphone
} from 'lucide-react'
import { toast } from 'sonner'

// Tipos
interface Plan {
  id: string
  slug: string
  name: string
  description: string
  price: number
  period: string
  benefits: Array<{
    id: string
    name: string
    description: string
  }>
}

interface CustomerData {
  name: string
  email: string
  cpfCnpj: string
  phone: string
  postalCode: string
  address: string
  addressNumber: string
  complement: string
  province: string
  city: string
  state: string
}

interface CardData {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  cvv: string
}

interface PaymentResult {
  success: boolean
  payment: {
    id: string
    status: string
    value: number
    billingType: string
    invoiceUrl?: string
    bankSlipUrl?: string
    dueDate?: string
  }
  pix?: {
    qrCode: string
    copyPaste: string
    expirationDate: string
  }
  subscription?: {
    id: string
    status: string
    nextDueDate: string
  }
  customer: {
    id: string
    name: string
    email: string
  }
  plan: {
    id: string
    name: string
    price: number
  }
  externalReference: string
}

type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO'

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.planId as string

  // Estados
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [createSubscription, setCreateSubscription] = useState(true)

  // Dados do cliente
  const [customer, setCustomer] = useState<CustomerData>({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: '',
    postalCode: '',
    address: '',
    addressNumber: '',
    complement: '',
    province: '',
    city: '',
    state: ''
  })

  // Dados do cartão
  const [cardData, setCardData] = useState<CardData>({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  })

  // Resultado do pagamento
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [pixCopied, setPixCopied] = useState(false)

  // Carregar plano
  useEffect(() => {
    fetchPlan()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId])

  const fetchPlan = async () => {
    try {
      const response = await fetch(`/api/plans/public/${planId}`)
      const data = await response.json()
      
      if (data.success && data.plan) {
        // Redirecionar para URL canônica (slug) se acessou por ID
        if (planId !== data.plan.slug) {
          console.log('[Checkout] Redirecionando de', planId, 'para', data.plan.slug)
          router.replace(`/checkout/${data.plan.slug}`)
          return
        }
        setPlan(data.plan)
      } else {
        toast.error('Plano não encontrado')
        router.push('/planos')
      }
    } catch (error) {
      console.error('[Checkout] Erro ao carregar plano:', error)
      toast.error('Erro ao carregar plano')
      router.push('/planos')
    } finally {
      setLoading(false)
    }
  }

  // Buscar endereço pelo CEP
  const fetchAddress = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) return

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()
      
      if (!data.erro) {
        setCustomer(prev => ({
          ...prev,
          address: data.logradouro || '',
          province: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || ''
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }

  // Máscaras
  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const maskCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const maskCPFCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.length <= 11 ? maskCPF(value) : maskCNPJ(value)
  }

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1')
  }

  const maskCardNumber = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})\d+?$/, '$1')
  }

  // Validações
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  
  const isValidCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '')
    if (numbers.length !== 11) return false
    if (/^(\d)\1+$/.test(numbers)) return false
    
    let sum = 0
    for (let i = 0; i < 9; i++) sum += parseInt(numbers[i]) * (10 - i)
    let digit = (sum * 10) % 11
    if (digit === 10) digit = 0
    if (digit !== parseInt(numbers[9])) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) sum += parseInt(numbers[i]) * (11 - i)
    digit = (sum * 10) % 11
    if (digit === 10) digit = 0
    return digit === parseInt(numbers[10])
  }

  const validateForm = (): string | null => {
    if (!customer.name.trim()) return 'Nome é obrigatório'
    if (!customer.email.trim()) return 'Email é obrigatório'
    if (!isValidEmail(customer.email)) return 'Email inválido'
    if (!customer.cpfCnpj.trim()) return 'CPF/CNPJ é obrigatório'
    
    const cpfNumbers = customer.cpfCnpj.replace(/\D/g, '')
    if (cpfNumbers.length === 11 && !isValidCPF(customer.cpfCnpj)) {
      return 'CPF inválido'
    }
    
    if (!customer.phone.trim()) return 'Telefone é obrigatório'
    if (customer.phone.replace(/\D/g, '').length < 10) return 'Telefone inválido'
    
    if (paymentMethod === 'BOLETO') {
      if (!customer.postalCode.trim()) return 'CEP é obrigatório para boleto'
      if (!customer.address.trim()) return 'Endereço é obrigatório para boleto'
      if (!customer.addressNumber.trim()) return 'Número é obrigatório para boleto'
      if (!customer.province.trim()) return 'Bairro é obrigatório para boleto'
      if (!customer.city.trim()) return 'Cidade é obrigatória para boleto'
      if (!customer.state.trim()) return 'Estado é obrigatório para boleto'
    }

    if (paymentMethod === 'CREDIT_CARD') {
      if (!cardData.holderName.trim()) return 'Nome no cartão é obrigatório'
      if (cardData.number.replace(/\D/g, '').length < 13) return 'Número do cartão inválido'
      if (!cardData.expiryMonth || !cardData.expiryYear) return 'Validade é obrigatória'
      if (cardData.cvv.length < 3) return 'CVV inválido'
    }

    if (!acceptTerms) return 'Você precisa aceitar os termos de uso'

    return null
  }

  // Processar pagamento
  const handleSubmit = async () => {
    const error = validateForm()
    if (error) {
      toast.error(error)
      return
    }

    setProcessing(true)

    try {
      let creditCardToken: string | undefined

      // Se for cartão, tokenizar primeiro
      if (paymentMethod === 'CREDIT_CARD') {
        const tokenResponse = await fetch('/api/checkout/asaas/tokenize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: {
              name: customer.name,
              email: customer.email,
              cpfCnpj: customer.cpfCnpj,
              phone: customer.phone,
              postalCode: customer.postalCode,
              addressNumber: customer.addressNumber
            },
            creditCard: {
              holderName: cardData.holderName,
              number: cardData.number.replace(/\s/g, ''),
              expiryMonth: cardData.expiryMonth,
              expiryYear: cardData.expiryYear,
              ccv: cardData.cvv
            }
          })
        })

        const tokenData = await tokenResponse.json()
        
        if (!tokenData.success) {
          throw new Error(tokenData.error || 'Erro ao processar cartão')
        }
        
        creditCardToken = tokenData.creditCardToken
      }

      // Criar cobrança - usar plan.id (ID real), não planId da URL
      const response = await fetch('/api/checkout/asaas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan!.id,
          customer,
          billingType: paymentMethod,
          createSubscription: createSubscription && paymentMethod !== 'PIX',
          creditCardToken,
          installmentCount: 1
        })
      })

      const data = await response.json()

      if (data.success) {
        setPaymentResult(data)
        
        if (paymentMethod === 'CREDIT_CARD') {
          // Cartão aprovado - redirecionar para sucesso
          toast.success('Pagamento aprovado!')
          router.push(`/checkout/sucesso?payment=${data.payment.id}`)
        } else {
          // PIX ou Boleto - mostrar instruções
          toast.success('Cobrança gerada com sucesso!')
        }
      } else {
        throw new Error(data.error || 'Erro ao processar pagamento')
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao processar pagamento')
    } finally {
      setProcessing(false)
    }
  }

  // Copiar código PIX
  const copyPixCode = () => {
    if (paymentResult?.pix?.copyPaste) {
      navigator.clipboard.writeText(paymentResult.pix.copyPaste)
      setPixCopied(true)
      toast.success('Código PIX copiado!')
      setTimeout(() => setPixCopied(false), 3000)
    }
  }

  // Verificar status do pagamento PIX
  const checkPaymentStatus = useCallback(async () => {
    if (!paymentResult?.payment?.id) return

    try {
      const response = await fetch(`/api/checkout/asaas/status/${paymentResult.payment.id}`)
      const data = await response.json()

      if (data.isConfirmed) {
        toast.success('Pagamento confirmado!')
        router.push(`/checkout/sucesso?payment=${paymentResult.payment.id}`)
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    }
  }, [paymentResult?.payment?.id, router])

  // Polling para verificar pagamento PIX
  useEffect(() => {
    if (paymentResult?.pix && paymentMethod === 'PIX') {
      const interval = setInterval(checkPaymentStatus, 5000) // Verifica a cada 5 segundos
      return () => clearInterval(interval)
    }
  }, [paymentResult, paymentMethod, checkPaymentStatus])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold">Plano não encontrado</h1>
          <Button onClick={() => router.push('/planos')} className="mt-4">
            Ver planos disponíveis
          </Button>
        </div>
      </div>
    )
  }

  // Se já tem resultado de PIX ou Boleto, mostrar instruções
  if (paymentResult && (paymentMethod === 'PIX' || paymentMethod === 'BOLETO')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="text-center bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4" />
              <CardTitle className="text-2xl">Cobrança Gerada!</CardTitle>
              <CardDescription className="text-green-100">
                {paymentMethod === 'PIX' ? 'Escaneie o QR Code ou copie o código' : 'Seu boleto foi gerado'}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Resumo */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Plano</span>
                  <span className="font-semibold">{plan.name}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Valor</span>
                  <span className="font-bold text-xl text-green-600">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* PIX */}
              {paymentMethod === 'PIX' && paymentResult.pix && (
                <div className="space-y-4">
                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:image/png;base64,${paymentResult.pix.qrCode}`}
                        alt="QR Code PIX"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>

                  {/* Código copia e cola */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Código PIX (copia e cola)</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={paymentResult.pix.copyPaste}
                        className="font-mono text-xs"
                      />
                      <Button 
                        variant="outline" 
                        onClick={copyPixCode}
                        className={pixCopied ? 'bg-green-100' : ''}
                      >
                        {pixCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Instruções */}
                  <Alert>
                    <Smartphone className="h-4 w-4" />
                    <AlertDescription>
                      Abra o app do seu banco, escolha pagar com PIX e escaneie o QR Code ou cole o código.
                    </AlertDescription>
                  </Alert>

                  {/* Status */}
                  <div className="flex items-center justify-center gap-2 text-yellow-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Aguardando pagamento...</span>
                  </div>
                </div>
              )}

              {/* Boleto */}
              {paymentMethod === 'BOLETO' && paymentResult.payment?.bankSlipUrl && (
                <div className="space-y-4">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => window.open(paymentResult.payment.bankSlipUrl, '_blank')}
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Visualizar Boleto
                  </Button>

                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      O boleto pode levar até 3 dias úteis para ser compensado após o pagamento.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Voltar */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao início
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Finalizar Assinatura</h1>
          <p className="text-gray-600 mt-2">Complete seus dados para ativar seu plano</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulário */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      placeholder="Seu nome completo"
                      value={customer.name}
                      onChange={(e) => setCustomer({...customer, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={customer.email}
                      onChange={(e) => setCustomer({...customer, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpfCnpj">CPF/CNPJ *</Label>
                    <Input
                      id="cpfCnpj"
                      placeholder="000.000.000-00"
                      value={customer.cpfCnpj}
                      onChange={(e) => setCustomer({...customer, cpfCnpj: maskCPFCNPJ(e.target.value)})}
                      maxLength={18}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={customer.phone}
                      onChange={(e) => setCustomer({...customer, phone: maskPhone(e.target.value)})}
                      maxLength={15}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Endereço (apenas para boleto) */}
            {paymentMethod === 'BOLETO' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    Endereço
                    <Badge variant="secondary" className="ml-2">Obrigatório para boleto</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">CEP *</Label>
                      <Input
                        id="postalCode"
                        placeholder="00000-000"
                        value={customer.postalCode}
                        onChange={(e) => {
                          const value = maskCEP(e.target.value)
                          setCustomer({...customer, postalCode: value})
                          if (value.replace(/\D/g, '').length === 8) {
                            fetchAddress(value)
                          }
                        }}
                        maxLength={9}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address">Endereço *</Label>
                      <Input
                        id="address"
                        placeholder="Rua, Avenida..."
                        value={customer.address}
                        onChange={(e) => setCustomer({...customer, address: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addressNumber">Número *</Label>
                      <Input
                        id="addressNumber"
                        placeholder="123"
                        value={customer.addressNumber}
                        onChange={(e) => setCustomer({...customer, addressNumber: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        placeholder="Apto, Sala..."
                        value={customer.complement}
                        onChange={(e) => setCustomer({...customer, complement: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="province">Bairro *</Label>
                      <Input
                        id="province"
                        placeholder="Bairro"
                        value={customer.province}
                        onChange={(e) => setCustomer({...customer, province: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        placeholder="Cidade"
                        value={customer.city}
                        onChange={(e) => setCustomer({...customer, city: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado *</Label>
                      <Input
                        id="state"
                        placeholder="UF"
                        value={customer.state}
                        onChange={(e) => setCustomer({...customer, state: e.target.value.toUpperCase()})}
                        maxLength={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Forma de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {paymentMethod === 'BOLETO' ? '3' : '2'}
                  </span>
                  Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="PIX" className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      <span className="hidden sm:inline">PIX</span>
                    </TabsTrigger>
                    <TabsTrigger value="CREDIT_CARD" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="hidden sm:inline">Cartão</span>
                    </TabsTrigger>
                    <TabsTrigger value="BOLETO" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Boleto</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* PIX */}
                  <TabsContent value="PIX" className="space-y-4">
                    <Alert className="bg-green-50 border-green-200">
                      <QrCode className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Pagamento instantâneo! Após o pagamento, seu plano será ativado automaticamente.
                      </AlertDescription>
                    </Alert>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500" />
                      Aprovação imediata
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500" />
                      Sem taxas adicionais
                    </div>
                  </TabsContent>

                  {/* Cartão */}
                  <TabsContent value="CREDIT_CARD" className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="cardNumber">Número do Cartão *</Label>
                        <Input
                          id="cardNumber"
                          placeholder="0000 0000 0000 0000"
                          value={cardData.number}
                          onChange={(e) => setCardData({...cardData, number: maskCardNumber(e.target.value)})}
                          maxLength={19}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="holderName">Nome no Cartão *</Label>
                        <Input
                          id="holderName"
                          placeholder="NOME COMO ESTÁ NO CARTÃO"
                          value={cardData.holderName}
                          onChange={(e) => setCardData({...cardData, holderName: e.target.value.toUpperCase()})}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                        <div className="space-y-2">
                          <Label htmlFor="expiryMonth">Mês *</Label>
                          <Input
                            id="expiryMonth"
                            placeholder="MM"
                            value={cardData.expiryMonth}
                            onChange={(e) => setCardData({...cardData, expiryMonth: e.target.value.replace(/\D/g, '').slice(0, 2)})}
                            maxLength={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expiryYear">Ano *</Label>
                          <Input
                            id="expiryYear"
                            placeholder="AA"
                            value={cardData.expiryYear}
                            onChange={(e) => setCardData({...cardData, expiryYear: e.target.value.replace(/\D/g, '').slice(0, 2)})}
                            maxLength={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV *</Label>
                          <Input
                            id="cvv"
                            type="password"
                            placeholder="***"
                            value={cardData.cvv}
                            onChange={(e) => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
                      <Shield className="h-4 w-4" />
                      Seus dados são criptografados e seguros
                    </div>
                  </TabsContent>

                  {/* Boleto */}
                  <TabsContent value="BOLETO" className="space-y-4">
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        O boleto pode levar até 3 dias úteis para ser compensado.
                      </AlertDescription>
                    </Alert>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500" />
                      Vencimento em 3 dias
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500" />
                      Pague em qualquer banco
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Opções */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                {paymentMethod !== 'PIX' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="subscription"
                      checked={createSubscription}
                      onCheckedChange={(checked) => setCreateSubscription(checked as boolean)}
                    />
                    <Label htmlFor="subscription" className="text-sm cursor-pointer">
                      Ativar renovação automática mensal
                    </Label>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm cursor-pointer">
                    Li e aceito os{' '}
                    <a href="/termos" target="_blank" className="text-primary hover:underline">
                      termos de uso
                    </a>{' '}
                    e{' '}
                    <a href="/privacidade" target="_blank" className="text-primary hover:underline">
                      política de privacidade
                    </a>
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-lg">
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Benefícios inclusos:</p>
                  <ul className="space-y-1">
                    {plan.benefits.slice(0, 5).map((benefit) => (
                      <li key={benefit.id} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{benefit.name}</span>
                      </li>
                    ))}
                    {plan.benefits.length > 5 && (
                      <li className="text-sm text-gray-500">
                        +{plan.benefits.length - 5} benefícios
                      </li>
                    )}
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-green-600">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <p className="text-xs text-gray-500">/mês</p>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleSubmit}
                  disabled={processing || !acceptTerms}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      {paymentMethod === 'PIX' && <QrCode className="mr-2 h-4 w-4" />}
                      {paymentMethod === 'CREDIT_CARD' && <CreditCard className="mr-2 h-4 w-4" />}
                      {paymentMethod === 'BOLETO' && <FileText className="mr-2 h-4 w-4" />}
                      {paymentMethod === 'PIX' && 'Gerar QR Code'}
                      {paymentMethod === 'CREDIT_CARD' && 'Pagar Agora'}
                      {paymentMethod === 'BOLETO' && 'Gerar Boleto'}
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Shield className="h-3 w-3" />
                  Pagamento seguro via Asaas
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

