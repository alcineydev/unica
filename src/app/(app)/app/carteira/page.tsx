'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  QrCode, RefreshCw, Share2, Download, Crown,
  CheckCircle, AlertCircle, History, ArrowUpRight,
  ArrowDownRight, Eye, EyeOff, Copy,
  Coins, TrendingUp, Gift
} from 'lucide-react'
import { toast } from 'sonner'

// ==========================================
// Tipos
// ==========================================

interface Transaction {
  id: string
  amount: number
  pointsUsed: number
  cashbackGenerated: number
  type: string
  status: string
  createdAt: string
  parceiro: { companyName: string; tradeName: string }
}

interface CarteiraData {
  assinante: {
    name: string
    email?: string
    avatar?: string
    cpf: string
    qrCode: string
    points: number
    cashback: number
    status?: string
    plan: { name: string } | null
  }
  transactions: Transaction[]
}

// ==========================================
// Helpers
// ==========================================

function getStatusInfo(status?: string) {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Ativo', bg: 'bg-green-500', icon: CheckCircle }
    case 'PENDING':
      return { label: 'Pendente', bg: 'bg-amber-500', icon: AlertCircle }
    case 'CANCELLED':
      return { label: 'Cancelado', bg: 'bg-red-500', icon: AlertCircle }
    default:
      return { label: 'Ativo', bg: 'bg-green-500', icon: CheckCircle }
  }
}

function maskCPF(cpf: string) {
  if (!cpf || cpf.length !== 11) return '***.***.***-**'
  return `${cpf.slice(0, 3)}.***.**-${cpf.slice(-2)}`
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ==========================================
// Componente Principal
// ==========================================

export default function CarteiraPage() {
  const [data, setData] = useState<CarteiraData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showValues, setShowValues] = useState(true)
  const [activeTab, setActiveTab] = useState<'qrcode' | 'extrato'>('qrcode')

  useEffect(() => {
    fetchCarteira()
  }, [])

  const fetchCarteira = async () => {
    try {
      const response = await fetch('/api/app/carteira')
      const result = await response.json()
      if (response.ok && result.data) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Erro ao buscar carteira:', error)
      toast.error('Erro ao carregar carteira')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchCarteira()
    setIsRefreshing(false)
    toast.success('Carteira atualizada!')
  }

  const handleShare = async () => {
    if (!data?.assinante?.qrCode) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Minha Carteirinha UNICA',
          text: `Meu código: ${data.assinante.qrCode}`,
        })
      } catch {
        // Usuário cancelou
      }
    } else {
      navigator.clipboard.writeText(data.assinante.qrCode)
      toast.success('Código copiado!')
    }
  }

  const handleCopyCode = () => {
    if (!data?.assinante?.qrCode) return
    navigator.clipboard.writeText(data.assinante.qrCode)
    toast.success('Código copiado!')
  }

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)

      const link = document.createElement('a')
      link.download = `carteira-unica-${data?.assinante?.name?.replace(/\s+/g, '-').toLowerCase() || 'assinante'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }

    img.src =
      'data:image/svg+xml;base64,' +
      btoa(unescape(encodeURIComponent(svgData)))
    toast.success('QR Code baixado!')
  }

  // ==========================================
  // Loading
  // ==========================================

  if (isLoading) {
    return (
      <div className="space-y-0 -mx-4 sm:-mx-6">
        <Skeleton className="h-[320px] rounded-none" />
        <div className="px-4 sm:px-6 space-y-4 mt-4">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    )
  }

  // ==========================================
  // Erro
  // ==========================================

  if (!data?.assinante) {
    return (
      <div className="text-center py-12">
        <QrCode className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Carteira não disponível
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Não foi possível carregar sua carteira
        </p>
        <Button onClick={fetchCarteira}>Tentar novamente</Button>
      </div>
    )
  }

  // ==========================================
  // Render
  // ==========================================

  const { assinante, transactions } = data
  const statusInfo = getStatusInfo(assinante.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="space-y-0 pb-24">
      {/* ===== HERO - BANKING STYLE ===== */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-br from-[#0a1628] via-[#0f1f3d] to-[#0a1628]">
          {/* Decoração abstrata */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/[0.08] rounded-full blur-[100px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/[0.06] rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-500/[0.04] rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          <div className="relative px-5 pt-6 pb-8">
            {/* Topo: usuário + status + ações */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white/15 shadow-lg">
                  <AvatarImage src={assinante.avatar} />
                  <AvatarFallback className="bg-blue-500/20 text-white text-sm font-semibold">
                    {assinante.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-semibold text-sm">
                    {assinante.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {assinante.plan && (
                      <span className="text-[11px] text-blue-300/70">
                        {assinante.plan.name}
                      </span>
                    )}
                    <span className="text-blue-300/30">•</span>
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${statusInfo.bg}`}
                      />
                      <span className="text-[11px] text-blue-300/70">
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowValues(!showValues)}
                  className="p-2 rounded-full text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
                  title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
                >
                  {showValues ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={handleRefresh}
                  className="p-2 rounded-full text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
                  title="Atualizar carteira"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Saldo principal - Cashback */}
            <div className="mb-6">
              <p className="text-[11px] text-blue-300/50 uppercase tracking-widest mb-1">
                Cashback disponível
              </p>
              <h1 className="text-[32px] sm:text-4xl font-extrabold text-white tracking-tight">
                {showValues
                  ? formatCurrency(assinante.cashback || 0)
                  : 'R$ •••••'}
              </h1>
            </div>

            {/* Cards de métricas */}
            <div className="grid grid-cols-2 gap-3">
              {/* Pontos */}
              <div className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 bg-amber-400/15 rounded-lg flex items-center justify-center">
                    <Coins className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <span className="text-[11px] text-white/40 font-medium">
                    Pontos
                  </span>
                </div>
                <p className="text-xl font-bold text-white">
                  {showValues
                    ? Number(assinante.points || 0).toLocaleString('pt-BR')
                    : '•••'}
                </p>
                <p className="text-[10px] text-white/25 mt-1">acumulados</p>
              </div>

              {/* Economia estimada */}
              <div className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 bg-green-400/15 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                  </div>
                  <span className="text-[11px] text-white/40 font-medium">
                    Economia
                  </span>
                </div>
                <p className="text-xl font-bold text-white">
                  {showValues
                    ? formatCurrency(
                        (assinante.cashback || 0) +
                          (assinante.points || 0) * 0.01
                      )
                    : 'R$ •••'}
                </p>
                <p className="text-[10px] text-white/25 mt-1">
                  total estimada
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Curva inferior */}
        <div className="h-5 bg-gradient-to-b from-[#0a1628] to-transparent rounded-b-3xl" />
      </div>

      {/* ===== AÇÕES RÁPIDAS ===== */}
      <div className="px-4 sm:px-6 -mt-1">
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              icon: QrCode,
              label: 'QR Code',
              onClick: () => setActiveTab('qrcode'),
              color: 'text-blue-600 bg-blue-50',
            },
            {
              icon: Share2,
              label: 'Enviar',
              onClick: handleShare,
              color: 'text-violet-600 bg-violet-50',
            },
            {
              icon: Download,
              label: 'Baixar',
              onClick: handleDownload,
              color: 'text-green-600 bg-green-50',
            },
            {
              icon: History,
              label: 'Extrato',
              onClick: () => setActiveTab('extrato'),
              color: 'text-amber-600 bg-amber-50',
            },
          ].map(({ icon: Icon, label, onClick, color }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white border border-gray-100 hover:shadow-md hover:border-gray-200 active:scale-95 transition-all"
            >
              <div
                className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-semibold text-gray-500">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== TABS: QR CODE / EXTRATO ===== */}
      <div className="px-4 sm:px-6 mt-5">
        {/* Tab headers */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
          {[
            { key: 'qrcode' as const, label: 'Carteirinha' },
            { key: 'extrato' as const, label: 'Extrato' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ===== TAB: CARTEIRINHA ===== */}
        {activeTab === 'qrcode' && (
          <div className="space-y-4">
            {/* Card QR Code */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Header do card */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white font-extrabold text-[10px]">
                      U
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">UNICA</p>
                    <p className="text-[10px] text-gray-400 -mt-0.5">
                      Clube de Benefícios
                    </p>
                  </div>
                </div>
                <Badge
                  className={`${statusInfo.bg} text-white border-0 text-[10px] px-2`}
                >
                  <StatusIcon className="h-2.5 w-2.5 mr-1" />
                  {statusInfo.label}
                </Badge>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center py-6 px-5">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-4">
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={assinante.qrCode || 'UNICA'}
                    size={180}
                    level="H"
                    includeMargin={false}
                    className="w-[150px] h-[150px] sm:w-[180px] sm:h-[180px]"
                  />
                </div>
                <p className="text-xs text-gray-400 mb-1">
                  Apresente ao parceiro
                </p>

                {/* Código copiável */}
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                >
                  <span className="font-mono text-xs text-gray-500 tracking-wider">
                    {assinante.qrCode}
                  </span>
                  <Copy className="h-3 w-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </button>
              </div>

              {/* Dados do titular */}
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage src={assinante.avatar} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-semibold">
                      {assinante.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {assinante.name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      CPF: {maskCPF(assinante.cpf || '')}
                    </p>
                  </div>
                  {assinante.plan && (
                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg">
                      <Crown className="h-3 w-3" />
                      <span className="text-[11px] font-semibold">
                        {assinante.plan.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dica */}
            <div className="flex items-center gap-3 p-3.5 bg-blue-50/60 border border-blue-100/80 rounded-xl">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Gift className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Apresente o QR Code no parceiro para usar seus benefícios e
                acumular pontos automaticamente.
              </p>
            </div>
          </div>
        )}

        {/* ===== TAB: EXTRATO ===== */}
        {activeTab === 'extrato' && (
          <div className="space-y-3">
            {/* Resumo do período */}
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
              <div>
                <p className="text-[11px] text-gray-400 mb-0.5">
                  Total em transações
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {showValues
                    ? formatCurrency(
                        (transactions || []).reduce(
                          (sum, tx) => sum + (tx.amount || 0),
                          0
                        )
                      )
                    : 'R$ •••••'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-400 mb-0.5">
                  Cashback ganho
                </p>
                <p className="text-lg font-bold text-green-600">
                  {showValues
                    ? formatCurrency(
                        (transactions || []).reduce(
                          (sum, tx) => sum + (tx.cashbackGenerated || 0),
                          0
                        )
                      )
                    : 'R$ •••••'}
                </p>
              </div>
            </div>

            {/* Lista de transações */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {transactions && transactions.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {transactions.slice(0, 15).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            tx.type === 'PURCHASE'
                              ? 'bg-blue-50'
                              : 'bg-green-50'
                          }`}
                        >
                          {tx.type === 'PURCHASE' ? (
                            <ArrowDownRight className="h-4 w-4 text-blue-500" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {tx.parceiro?.tradeName ||
                              tx.parceiro?.companyName ||
                              'Transação'}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {formatDate(tx.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {showValues ? formatCurrency(tx.amount) : '•••'}
                        </p>
                        {tx.cashbackGenerated > 0 && (
                          <p className="text-[11px] text-green-600 font-medium">
                            +
                            {showValues
                              ? formatCurrency(tx.cashbackGenerated)
                              : '•••'}
                          </p>
                        )}
                        {tx.pointsUsed > 0 && (
                          <p className="text-[11px] text-amber-600 font-medium">
                            -{Number(tx.pointsUsed).toFixed(0)} pts
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <History className="h-7 w-7 text-gray-200" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">
                    Nenhuma transação
                  </p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Use seus benefícios nos parceiros
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
