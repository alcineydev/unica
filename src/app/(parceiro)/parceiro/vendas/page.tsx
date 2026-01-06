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

import { ParceiroPageHeader } from '@/components/parceiro/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

// Import dinâmico do scanner
const QRCodeScanner = dynamic(
  () => import('@/components/qrcode/scanner').then(mod => mod.QRCodeScanner || mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-square bg-slate-900 rounded-xl flex items-center justify-center">
        <div className="text-center text-white">
          <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-400">Carregando scanner...</p>
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
  const [inputMethod, setInputMethod] = useState<'scanner' | 'manual'>('scanner')

  // Buscar assinante por CPF
  async function searchAssinanteByCPF(cpfValue: string) {
    const cleanCpf = cpfValue.replace(/\D/g, '')
    if (cleanCpf.length !== 11) {
      toast.error('CPF deve ter 11 dígitos')
      return
    }
    await searchAssinante(cleanCpf, 'cpf')
  }

  // Buscar assinante
  async function searchAssinante(valor: string, tipo: 'qrcode' | 'cpf' = 'qrcode') {
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
      toast.success(`Cliente encontrado: ${ass.nome || 'Cliente'}`)
    } catch (error) {
      console.error('[VENDAS] Erro ao buscar cliente:', error)
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setIsSearching(false)
    }
  }

  function handleQRCodeScan(result: string) {
    if (!result || result.trim() === '') {
      toast.error('QR Code inválido ou vazio')
      return
    }
    searchAssinante(result.trim(), 'qrcode')
  }

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

  function formatCPF(value: string): string {
    return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  function getDiscount(): number {
    if (!assinante?.plan?.planBenefits) return 0
    const discountBenefit = assinante.plan.planBenefits.find(
      pb => pb.benefit.type === 'DESCONTO'
    )
    if (discountBenefit) {
      const value = discountBenefit.benefit.value as { percentage?: number }
      return value.percentage || 0
    }
    return 0
  }

  function getCashback(): number {
    if (!assinante?.plan?.planBenefits) return 0
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
      <ParceiroPageHeader
        title="Registrar Venda"
        description="Escaneie o QR Code ou digite o CPF do cliente"
        breadcrumbs={[
          { label: 'Parceiro', href: '/parceiro' },
          { label: 'Registrar Venda' }
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card de Identificação */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <QrCode className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Identificar Cliente</h2>
                <p className="text-sm text-slate-500">Use o scanner ou digite o CPF</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as 'scanner' | 'manual')}>
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="scanner" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Camera className="h-4 w-4" />
                  Scanner
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
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
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <p className="text-slate-600">Cliente identificado!</p>
                    <button
                      className="mt-4 px-4 py-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                      onClick={() => {
                        setAssinante(null)
                        setCpf('')
                      }}
                    >
                      Escanear Outro
                    </button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="manual" className="mt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite o CPF (11 dígitos)"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    maxLength={11}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <button
                    onClick={() => searchAssinanteByCPF(cpf)}
                    disabled={isSearching || cpf.length !== 11}
                    className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSearching ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Search className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Info do assinante */}
            {assinante && (
              <div className="rounded-xl bg-slate-50 p-4 space-y-3 mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{assinante.name}</p>
                    <p className="text-sm text-slate-500">{formatCPF(assinante.cpf)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    assinante.subscriptionStatus === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {assinante.subscriptionStatus === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="h-px bg-slate-200" />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">Plano: <strong className="text-slate-900">{assinante.plan?.name || 'Sem plano'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-500" />
                    <span className="text-slate-600">Pontos: <strong className="text-slate-900">{Number(assinante.points || 0).toFixed(0)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-blue-500" />
                    <span className="text-slate-600">Desconto: <strong className="text-slate-900">{getDiscount()}%</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-emerald-500" />
                    <span className="text-slate-600">Cashback: <strong className="text-slate-900">{getCashback()}%</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card de Venda */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Dados da Venda</h2>
                <p className="text-sm text-slate-500">Informe o valor e opções</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-slate-700">Valor da Compra (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!assinante}
                className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>

            {assinante && Number(assinante.points || 0) > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-amber-600" />
                    <span className="font-medium text-slate-900">Usar Pontos</span>
                  </div>
                  <button
                    onClick={() => {
                      setUsePoints(!usePoints)
                      if (!usePoints) {
                        setPointsToUse(String(assinante.points || 0))
                      } else {
                        setPointsToUse('')
                      }
                    }}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      usePoints
                        ? 'bg-amber-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {usePoints ? 'Sim' : 'Não'}
                  </button>
                </div>

                {usePoints && (
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-600">Pontos a utilizar (máx: {Number(assinante.points || 0).toFixed(0)})</Label>
                    <Input
                      type="number"
                      min="0"
                      max={Number(assinante.points || 0)}
                      value={pointsToUse}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setPointsToUse(Math.min(val, Number(assinante.points || 0)).toString())
                      }}
                      className="rounded-xl border-amber-200 focus:border-amber-500 focus:ring-amber-500/20"
                    />
                    <p className="text-xs text-amber-600">1 ponto = R$ 1,00</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleCalculate}
              disabled={!assinante || !amount || isCalculating || assinante?.subscriptionStatus !== 'ACTIVE'}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Calculando...
                </>
              ) : (
                'Calcular Venda'
              )}
            </button>

            {assinante && assinante.subscriptionStatus !== 'ACTIVE' && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl">
                <AlertCircle className="h-5 w-5" />
                Assinatura inativa. Não é possível registrar venda.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de Confirmação */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
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
                  <div className="rounded-xl bg-slate-50 p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cliente:</span>
                      <span className="font-medium text-slate-900">{saleData.assinante.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Valor Original:</span>
                      <span className="text-slate-900">{formatCurrency(saleData.amount)}</span>
                    </div>
                    {saleData.discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Desconto:</span>
                        <span>- {formatCurrency(saleData.discount)}</span>
                      </div>
                    )}
                    {saleData.pointsUsed > 0 && (
                      <div className="flex justify-between text-amber-600">
                        <span>Pontos Usados:</span>
                        <span>- {formatCurrency(saleData.pointsUsed)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-slate-900">Total a Pagar:</span>
                      <span className="text-emerald-600">{formatCurrency(saleData.finalAmount)}</span>
                    </div>
                    {saleData.cashbackGenerated > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Cashback Gerado:</span>
                        <span>+ {formatCurrency(saleData.cashbackGenerated)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmOpen(false)} className="rounded-xl">
                  Cancelar
                </Button>
                <Button onClick={handleConfirmSale} disabled={isProcessing} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
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
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Venda Registrada!</h3>
              <p className="text-slate-500 mb-6">
                A transação foi processada com sucesso.
              </p>
              <Button onClick={handleNewSale} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700">
                Nova Venda
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
