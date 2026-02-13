'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  CreditCard, QrCode, FileText, ChevronLeft, Loader2,
  Shield, Lock, Smartphone
} from 'lucide-react'
import { toast } from 'sonner'

type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO'

interface PaymentFormProps {
  selectedMethod: PaymentMethod
  onMethodChange: (method: PaymentMethod) => void
  cardData: {
    holderName: string
    number: string
    expiry: string
    cvv: string
  }
  onCardChange: (data: PaymentFormProps['cardData']) => void
  onSubmit: () => void
  onBack: () => void
  loading: boolean
  planPrice: number
  acceptedTerms: boolean
  onTermsChange: (checked: boolean) => void
}

const METHODS: { id: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }>; description: string; badge?: string }[] = [
  { id: 'PIX', label: 'PIX', icon: QrCode, description: 'Aprovação instantânea', badge: 'Recomendado' },
  { id: 'CREDIT_CARD', label: 'Cartão de Crédito', icon: CreditCard, description: 'Até 12x sem juros' },
  { id: 'BOLETO', label: 'Boleto', icon: FileText, description: '1-3 dias úteis' },
]

export default function CheckoutPaymentForm({
  selectedMethod, onMethodChange,
  cardData, onCardChange,
  onSubmit, onBack,
  loading, planPrice,
  acceptedTerms, onTermsChange,
}: PaymentFormProps) {

  const formatCardNumber = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim()
  }

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 4)
    if (numbers.length >= 3) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    return numbers
  }

  const validateCard = () => {
    if (selectedMethod !== 'CREDIT_CARD') return null
    if (!cardData.holderName?.trim()) return 'Nome no cartão é obrigatório'
    if (cardData.number.replace(/\D/g, '').length < 13) return 'Número do cartão inválido'
    if (cardData.expiry.replace(/\D/g, '').length !== 4) return 'Validade inválida'
    if (cardData.cvv.length < 3) return 'CVV inválido'
    return null
  }

  const handleSubmit = () => {
    if (!acceptedTerms) {
      toast.error('Aceite os termos para continuar')
      return
    }
    const error = validateCard()
    if (error) {
      toast.error(error)
      return
    }
    onSubmit()
  }

  return (
    <div className="space-y-4">
      {/* Método de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            Forma de Pagamento
          </CardTitle>
          <CardDescription>Escolha como deseja pagar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {METHODS.map((method) => {
            const Icon = method.icon
            const isSelected = selectedMethod === method.id
            return (
              <button
                key={method.id}
                onClick={() => onMethodChange(method.id)}
                disabled={loading}
                className={`
                  w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left
                  ${isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-muted hover:border-primary/30'
                  }
                `}
              >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-white' : 'bg-muted'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{method.label}</p>
                    {method.badge && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                        {method.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{method.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-primary' : 'border-muted-foreground/30'
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* Dados do Cartão (condicional) */}
      {selectedMethod === 'CREDIT_CARD' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados do Cartão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-holder">Nome no Cartão *</Label>
              <Input
                id="card-holder"
                value={cardData.holderName}
                onChange={(e) => onCardChange({ ...cardData, holderName: e.target.value.toUpperCase() })}
                placeholder="NOME COMO NO CARTÃO"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-number">Número do Cartão *</Label>
              <Input
                id="card-number"
                value={formatCardNumber(cardData.number)}
                onChange={(e) => onCardChange({ ...cardData, number: e.target.value.replace(/\D/g, '') })}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="card-expiry">Validade *</Label>
                <Input
                  id="card-expiry"
                  value={formatExpiry(cardData.expiry)}
                  onChange={(e) => onCardChange({ ...cardData, expiry: e.target.value.replace(/\D/g, '') })}
                  placeholder="MM/AA"
                  maxLength={5}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-cvv">CVV *</Label>
                <Input
                  id="card-cvv"
                  value={cardData.cvv}
                  onChange={(e) => onCardChange({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="000"
                  maxLength={4}
                  type="password"
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info por método */}
      {selectedMethod === 'PIX' && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">PIX - Aprovação instantânea</p>
                <p className="text-xs text-green-600/70 dark:text-green-500/70">QR Code válido por 30 minutos. Seu plano é ativado imediatamente após o pagamento.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedMethod === 'BOLETO' && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Boleto Bancário</p>
                <p className="text-xs text-amber-600/70 dark:text-amber-500/70">O boleto será gerado após confirmar. Compensação em até 3 dias úteis.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Termos + Botão */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-2 mb-4">
            <Checkbox
              id="checkout-terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => onTermsChange(checked === true)}
              disabled={loading}
            />
            <label htmlFor="checkout-terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              Li e aceito os{' '}
              <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-primary underline">termos de uso</a>
              {' '}e a{' '}
              <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-primary underline">política de privacidade</a>
            </label>
          </div>

          <Separator className="mb-4" />

          {/* Resumo do valor */}
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium">Total</span>
            <span className="text-xl font-bold">R$ {planPrice.toFixed(2).replace('.', ',')}</span>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1" disabled={loading}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={loading || !acceptedTerms}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Pagar Agora
                </>
              )}
            </Button>
          </div>

          {/* Trust */}
          <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Ambiente seguro · Asaas Pagamentos</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
