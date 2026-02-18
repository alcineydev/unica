'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
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
  Keyboard,
  Camera,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Import dinâmico do scanner (desabilita SSR para evitar erros com APIs do browser)
const QRCodeScanner = dynamic(
  () => import('@/components/qrcode/scanner').then(mod => mod.QRCodeScanner || mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-square bg-zinc-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-white">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-zinc-400">Carregando scanner...</p>
        </div>
      </div>
    )
  }
)

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
  originalAmount: number
  finalAmount: number
  discountPercent: number
  discountAmount: number
  pointsAvailable: number
  pointsUsed: number
  cashbackAvailable: number
  cashbackToUse: number
  cashbackPercent: number
  cashbackGenerated: number
  cashbackNewBalance: number
  assinanteName: string
  planName: string
  parceiroName: string
}

export default function ParceiroVendaPage() {
  const [cpf, setCpf] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [assinante, setAssinante] = useState<AssinanteData | null>(null)
  const [amount, setAmount] = useState('')

  const [isCalculating, setIsCalculating] = useState(false)
  const [saleData, setSaleData] = useState<SaleData | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [inputMethod, setInputMethod] = useState<'scanner' | 'manual'>('scanner')
  const [useCashback, setUseCashback] = useState(false)
  const [cashbackAvailable, setCashbackAvailable] = useState(0)

  // Buscar assinante por CPF (digitado manualmente)
  async function searchAssinanteByCPF(cpfValue: string) {
    const cleanCpf = cpfValue.replace(/\D/g, '')

    if (cleanCpf.length !== 11) {
      toast.error('CPF deve ter 11 dígitos')
      return
    }

    await searchAssinante(cleanCpf, 'cpf')
  }

  // Buscar assinante por QR Code ou CPF (API unificada)
  async function searchAssinante(valor: string, tipo: 'qrcode' | 'cpf' = 'qrcode') {
    // Validar entrada
    if (!valor || valor.trim() === '') {
      toast.error('Código inválido')
      return
    }

    setIsSearching(true)
    setAssinante(null)

    try {
      const response = await fetch(`/api/parceiro/validar?${tipo}=${encodeURIComponent(valor.trim())}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Erro ao buscar cliente')
        return
      }

      const result = await response.json()

      if (!result.assinante) {
        toast.error('Cliente não encontrado')
        return
      }

      // Converter formato da nova API para o formato esperado
      const ass = result.assinante
      const assinanteData: AssinanteData = {
        id: ass.id || '',
        name: ass.nome || 'Sem nome',
        cpf: ass.cpf || '',
        points: ass.pontos || 0,
        cashback: ass.cashback || 0,
        subscriptionStatus: ass.status || 'PENDING',
        plan: {
          id: ass.plano?.id || '',
          name: ass.plano?.nome || 'Sem plano',
          planBenefits: Array.isArray(ass.beneficiosDisponiveis)
            ? ass.beneficiosDisponiveis.map((b: Record<string, unknown>) => ({
              benefit: {
                id: (b.id as string) || '',
                name: (b.nome as string) || '',
                type: (b.tipo as string) || '',
                value: (b.valor as Record<string, unknown>) || {}
              }
            }))
            : []
        }
      }
      setAssinante(assinanteData)
      setCpf(ass.cpf || '')
      setUseCashback(false)
      setSaleData(null)
      toast.success(`Cliente encontrado: ${ass.nome || 'Cliente'}`)

      // Buscar cashback disponível neste parceiro
      try {
        const cbRes = await fetch('/api/parceiro/venda/calcular', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assinanteId: assinanteData.id, amount: 1, useCashback: false }),
        })
        const cbData = await cbRes.json()
        setCashbackAvailable(cbData.data?.cashbackAvailable || 0)
      } catch {
        setCashbackAvailable(0)
      }
    } catch (error) {
      console.error('[VENDAS] Erro ao buscar cliente:', error)
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setIsSearching(false)
    }
  }

  // Handler para QR Code escaneado
  function handleQRCodeScan(result: string) {
    try {
      console.log('[SCAN] QR Code lido:', result)

      // Validar resultado
      if (!result || result.trim() === '') {
        toast.error('QR Code inválido ou vazio')
        return
      }

      // Enviar valor bruto - a API aceita ID, qrCode ou CPF
      searchAssinante(result.trim(), 'qrcode')
    } catch (error) {
      console.error('[SCAN] Erro ao processar QR Code:', error)
      toast.error('Erro ao processar QR Code')
    }
  }

  // Calcular venda
  async function handleCalculate() {
    if (!assinante || !amount) return

    const amountValue = parseFloat(amount)
    if (isNaN(amountValue) || amountValue < 1) {
      toast.error('Valor mínimo é R$ 1,00')
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
          useCashback,
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
    if (!saleData || !assinante) return

    setIsProcessing(true)

    try {
      const response = await fetch('/api/parceiro/venda/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assinanteId: assinante.id,
          amount: saleData.originalAmount,
          discountApplied: saleData.discountAmount,
          pointsUsed: saleData.pointsUsed,
          cashbackGenerated: saleData.cashbackGenerated,
          cashbackUsed: saleData.cashbackToUse,
          finalAmount: saleData.finalAmount,
          description: `Compra em ${saleData.parceiroName}`,
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
    setUseCashback(false)
    setCashbackAvailable(0)
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

  // Obter desconto disponível neste parceiro
  function getDiscount(): number {
    if (!assinante?.plan?.planBenefits) return 0
    const discountBenefit = assinante.plan.planBenefits.find(
      pb => pb.benefit.type === 'DESCONTO'
    )
    if (discountBenefit) {
      const value = discountBenefit.benefit.value as { percentage?: number; value?: number }
      return value.percentage || value.value || 0
    }
    return 0
  }

  // Obter cashback disponível neste parceiro
  function getCashback(): number {
    if (!assinante?.plan?.planBenefits) return 0
    const cashbackBenefit = assinante.plan.planBenefits.find(
      pb => pb.benefit.type === 'CASHBACK'
    )
    if (cashbackBenefit) {
      const value = cashbackBenefit.benefit.value as { percentage?: number; value?: number }
      return value.percentage || value.value || 0
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
        {/* Card de Identificação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Identificar Cliente
            </CardTitle>
            <CardDescription>
              Use o scanner ou digite o CPF manualmente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as 'scanner' | 'manual')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scanner" className="gap-2">
                  <Camera className="h-4 w-4" />
                  Scanner
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                  <Keyboard className="h-4 w-4" />
                  Digitar CPF
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scanner" className="mt-4">
                {!assinante ? (
                  <QRCodeScanner
                    onScan={handleQRCodeScan}
                    onError={(error) => console.error('Erro no scanner:', error)}
                  />
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-muted-foreground">Cliente identificado!</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setAssinante(null)
                        setCpf('')
                      }}
                    >
                      Escanear Outro
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="manual" className="mt-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Digite o CPF (11 dígitos)"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      maxLength={11}
                    />
                  </div>
                  <Button
                    onClick={() => searchAssinanteByCPF(cpf)}
                    disabled={isSearching || cpf.length !== 11}
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Info do assinante */}
            {assinante && (
              <div className="rounded-lg border p-4 space-y-3 mt-4">
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
                    <span>Plano: <strong>{assinante.plan?.name || 'Sem plano'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span>Pontos: <strong>{Number(assinante.points || 0).toFixed(0)}</strong></span>
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

                {cashbackAvailable > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">💰</span>
                        <span className="text-sm text-green-700">Cashback neste parceiro</span>
                      </div>
                      <span className="text-sm font-bold text-green-800">
                        {formatCurrency(cashbackAvailable)}
                      </span>
                    </div>
                  </>
                )}
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
              Informe o valor e opções de pagamento
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



            {assinante && cashbackAvailable > 0 && (
              <div className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-green-600" />
                    <div>
                      <span className="font-medium text-green-800">Usar Cashback</span>
                      <p className="text-xs text-green-600">
                        Disponível: {formatCurrency(cashbackAvailable)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={useCashback ? 'default' : 'outline'}
                    size="sm"
                    className={useCashback ? 'bg-green-600 hover:bg-green-700' : ''}
                    onClick={() => setUseCashback(!useCashback)}
                  >
                    {useCashback ? 'Sim' : 'Não'}
                  </Button>
                </div>
                {useCashback && (
                  <p className="text-xs text-green-600">
                    O cashback será descontado automaticamente do valor da compra.
                  </p>
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
                Assinatura inativa. Não é possível registrar venda.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação */}
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
                      <span className="font-medium">{saleData.assinanteName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Original:</span>
                      <span>{formatCurrency(saleData.originalAmount)}</span>
                    </div>
                    {saleData.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto ({saleData.discountPercent}%):</span>
                        <span>- {formatCurrency(saleData.discountAmount)}</span>
                      </div>
                    )}

                    {saleData.cashbackToUse > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Cashback Usado:</span>
                        <span>- {formatCurrency(saleData.cashbackToUse)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total a Pagar:</span>
                      <span>{formatCurrency(saleData.finalAmount)}</span>
                    </div>
                    {saleData.cashbackGenerated > 0 && (
                      <div className="flex justify-between text-sm pt-2 border-t border-dashed">
                        <span className="text-blue-600">Cashback Gerado:</span>
                        <span className="font-medium text-blue-600">+ {formatCurrency(saleData.cashbackGenerated)}</span>
                      </div>
                    )}
                    {saleData.cashbackGenerated > 0 && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Novo saldo cashback</span>
                        <span>{formatCurrency(saleData.cashbackNewBalance)}</span>
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
              <p className="text-muted-foreground mb-4">
                A transação foi processada com sucesso.
              </p>

              {saleData && (
                <div className="w-full rounded-lg bg-muted p-3 space-y-1.5 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total pago</span>
                    <span className="font-medium">{formatCurrency(saleData.finalAmount)}</span>
                  </div>
                  {saleData.cashbackToUse > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cashback utilizado</span>
                      <span className="font-medium text-emerald-600">
                        {formatCurrency(saleData.cashbackToUse)}
                      </span>
                    </div>
                  )}
                  {saleData.cashbackGenerated > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cashback gerado</span>
                      <span className="font-medium text-blue-600">
                        + {formatCurrency(saleData.cashbackGenerated)}
                      </span>
                    </div>
                  )}
                </div>
              )}

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
