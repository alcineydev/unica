'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  QrCode,
  Search,
  User,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Coins,
  Percent,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AssinanteData {
  id: string
  name: string
  cpf: string
  points: number
  cashback: number
  subscriptionStatus: string
  plan: {
    id: string
    name: string
    planBenefits: {
      benefit: {
        id: string
        name: string
        type: string
        value: Record<string, unknown>
      }
    }[]
  }
}

interface SaleData {
  assinante: AssinanteData
  amount: number
  discount: number
  pointsUsed: number
  cashbackGenerated: number
  finalAmount: number
}

export default function ParceiroVendaPage() {
  const [cpf, setCpf] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [assinante, setAssinante] = useState<AssinanteData | null>(null)
  const [amount, setAmount] = useState('')
  const [usePoints, setUsePoints] = useState(false)
  const [pointsToUse, setPointsToUse] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [saleData, setSaleData] = useState<SaleData | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Buscar assinante por CPF
  async function handleSearch() {
    if (cpf.length !== 11) {
      toast.error('CPF deve ter 11 digitos')
      return
    }

    setIsSearching(true)
    setAssinante(null)

    try {
      const response = await fetch(`/api/parceiro/assinante/${cpf}`)
      const result = await response.json()

      if (response.ok) {
        setAssinante(result.data)
        toast.success('Assinante encontrado!')
      } else {
        toast.error(result.error || 'Assinante nao encontrado')
      }
    } catch {
      toast.error('Erro ao buscar assinante')
    } finally {
      setIsSearching(false)
    }
  }

  // Calcular venda
  async function handleCalculate() {
    if (!assinante || !amount) return

    const amountValue = parseFloat(amount)
    if (isNaN(amountValue) || amountValue < 1) {
      toast.error('Valor minimo e R$ 1,00')
      return
    }

    setIsCalculating(true)

    try {
      const response = await fetch('/api/parceiro/venda/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assinanteId: assinante.id,
          amount: amountValue,
          usePoints,
          pointsToUse: usePoints ? parseFloat(pointsToUse) || 0 : 0,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSaleData(result.data)
        setIsConfirmOpen(true)
      } else {
        toast.error(result.error || 'Erro ao calcular venda')
      }
    } catch {
      toast.error('Erro ao calcular venda')
    } finally {
      setIsCalculating(false)
    }
  }

  // Confirmar venda
  async function handleConfirmSale() {
    if (!saleData) return

    setIsProcessing(true)

    try {
      const response = await fetch('/api/parceiro/venda/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assinanteId: saleData.assinante.id,
          amount: saleData.amount,
          pointsUsed: saleData.pointsUsed,
          discount: saleData.discount,
          cashbackGenerated: saleData.cashbackGenerated,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setIsSuccess(true)
        toast.success('Venda registrada com sucesso!')
      } else {
        toast.error(result.error || 'Erro ao registrar venda')
      }
    } catch {
      toast.error('Erro ao registrar venda')
    } finally {
      setIsProcessing(false)
    }
  }

  // Nova venda
  function handleNewSale() {
    setCpf('')
    setAssinante(null)
    setAmount('')
    setUsePoints(false)
    setPointsToUse('')
    setSaleData(null)
    setIsConfirmOpen(false)
    setIsSuccess(false)
  }

  // Formatar CPF
  function formatCPF(value: string): string {
    return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  // Formatar moeda
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  // Obter desconto do plano
  function getDiscount(): number {
    if (!assinante) return 0
    const discountBenefit = assinante.plan.planBenefits.find(
      pb => pb.benefit.type === 'DESCONTO'
    )
    if (discountBenefit) {
      const value = discountBenefit.benefit.value as { percentage?: number }
      return value.percentage || 0
    }
    return 0
  }

  // Obter cashback do plano
  function getCashback(): number {
    if (!assinante) return 0
    const cashbackBenefit = assinante.plan.planBenefits.find(
      pb => pb.benefit.type === 'CASHBACK'
    )
    if (cashbackBenefit) {
      const value = cashbackBenefit.benefit.value as { percentage?: number }
      return value.percentage || 0
    }
    return 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Registrar Venda</h1>
        <p className="text-muted-foreground">
          Escaneie o QR Code ou digite o CPF do cliente
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card de Busca */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Identificar Cliente
            </CardTitle>
            <CardDescription>
              Digite o CPF do assinante para iniciar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="00000000000"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  maxLength={11}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching || cpf.length !== 11}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Info do assinante */}
            {assinante && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{assinante.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCPF(assinante.cpf)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      assinante.subscriptionStatus === 'ACTIVE'
                        ? 'bg-green-500/10 text-green-600 border-green-500/20'
                        : 'bg-red-500/10 text-red-600 border-red-500/20'
                    }
                  >
                    {assinante.subscriptionStatus === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>Plano: <strong>{assinante.plan.name}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span>Pontos: <strong>{assinante.points.toFixed(0)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-blue-500" />
                    <span>Desconto: <strong>{getDiscount()}%</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-green-500" />
                    <span>Cashback: <strong>{getCashback()}%</strong></span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de Venda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Dados da Venda
            </CardTitle>
            <CardDescription>
              Informe o valor e opcoes de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor da Compra (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!assinante}
              />
            </div>

            {assinante && assinante.points > 0 && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Usar Pontos</span>
                  </div>
                  <Button
                    variant={usePoints ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setUsePoints(!usePoints)
                      if (!usePoints) {
                        setPointsToUse(assinante.points.toString())
                      } else {
                        setPointsToUse('')
                      }
                    }}
                  >
                    {usePoints ? 'Sim' : 'Nao'}
                  </Button>
                </div>

                {usePoints && (
                  <div className="space-y-2">
                    <Label>Pontos a utilizar (max: {assinante.points.toFixed(0)})</Label>
                    <Input
                      type="number"
                      min="0"
                      max={assinante.points}
                      value={pointsToUse}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setPointsToUse(Math.min(val, assinante.points).toString())
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      1 ponto = R$ 1,00
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleCalculate}
              disabled={!assinante || !amount || isCalculating || assinante.subscriptionStatus !== 'ACTIVE'}
            >
              {isCalculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculando...
                </>
              ) : (
                'Calcular Venda'
              )}
            </Button>

            {assinante && assinante.subscriptionStatus !== 'ACTIVE' && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                Assinatura inativa. Nao e possivel registrar venda.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmacao */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          {!isSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle>Confirmar Venda</DialogTitle>
                <DialogDescription>
                  Verifique os dados antes de confirmar
                </DialogDescription>
              </DialogHeader>

              {saleData && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cliente:</span>
                      <span className="font-medium">{saleData.assinante.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Original:</span>
                      <span>{formatCurrency(saleData.amount)}</span>
                    </div>
                    {saleData.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto:</span>
                        <span>- {formatCurrency(saleData.discount)}</span>
                      </div>
                    )}
                    {saleData.pointsUsed > 0 && (
                      <div className="flex justify-between text-yellow-600">
                        <span>Pontos Usados:</span>
                        <span>- {formatCurrency(saleData.pointsUsed)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total a Pagar:</span>
                      <span>{formatCurrency(saleData.finalAmount)}</span>
                    </div>
                    {saleData.cashbackGenerated > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Cashback Gerado:</span>
                        <span>+ {formatCurrency(saleData.cashbackGenerated)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmSale} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Confirmar Venda'
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="rounded-full bg-green-500/10 p-4 mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Venda Registrada!</h3>
              <p className="text-muted-foreground mb-6">
                A transacao foi processada com sucesso.
              </p>
              <Button onClick={handleNewSale} className="w-full">
                Nova Venda
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

