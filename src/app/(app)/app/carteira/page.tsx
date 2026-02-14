'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  QrCode, RefreshCw, Share2, Download, Crown,
  CheckCircle, AlertCircle, Smartphone, History,
  ArrowUpRight, ArrowDownRight
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-[480px] rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
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
    <div className="space-y-6 overflow-x-hidden pb-24">
      {/* Título */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900">Minha Carteirinha</h1>
        <p className="text-sm text-gray-400">
          Apresente o QR Code nos parceiros
        </p>
      </div>

      {/* ===== CARTÃO DIGITAL ===== */}
      <div className="relative overflow-hidden rounded-2xl shadow-xl">
        <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-6 space-y-5">
          {/* Decoração */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

          {/* Header do cartão */}
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-extrabold text-sm">U</span>
              </div>
              <div>
                <p className="font-bold text-white text-base">UNICA</p>
                <p className="text-[10px] text-gray-400">Clube de Benefícios</p>
              </div>
            </div>
            <Badge className={`${statusInfo.bg} text-white border-0 text-[11px]`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>

          {/* QR Code */}
          <div className="relative flex justify-center py-2">
            <div className="bg-white p-3 rounded-2xl shadow-lg">
              <QRCodeSVG
                id="qr-code-svg"
                value={assinante.qrCode || 'UNICA'}
                size={160}
                level="H"
                includeMargin={false}
                className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px]"
              />
            </div>
          </div>

          {/* Código textual */}
          <div className="relative text-center">
            <p className="text-[10px] text-gray-500 mb-0.5">Código da carteira</p>
            <p className="font-mono text-xs tracking-widest text-gray-300">
              {assinante.qrCode}
            </p>
          </div>

          {/* Dados do usuário */}
          <div className="relative flex items-center gap-3 pt-4 border-t border-white/10">
            <Avatar className="h-12 w-12 border-2 border-white/20">
              <AvatarImage src={assinante.avatar} />
              <AvatarFallback className="bg-blue-600/30 text-white text-sm font-semibold">
                {assinante.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{assinante.name}</p>
              <p className="text-xs text-gray-400">
                CPF: {maskCPF(assinante.cpf || '')}
              </p>
            </div>
          </div>

          {/* Plano */}
          {assinante.plan && (
            <div className="relative flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-gray-300">Plano</span>
              </div>
              <span className="font-semibold text-white text-sm">
                {assinante.plan.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ===== AÇÕES ===== */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: RefreshCw, label: 'Atualizar', onClick: handleRefresh, spin: isRefreshing },
          { icon: Share2, label: 'Compartilhar', onClick: handleShare, spin: false },
          { icon: Download, label: 'Baixar', onClick: handleDownload, spin: false },
        ].map(({ icon: Icon, label, onClick, spin }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all"
          >
            <Icon className={`h-5 w-5 text-gray-500 ${spin ? 'animate-spin' : ''}`} />
            <span className="text-[11px] font-medium text-gray-500">{label}</span>
          </button>
        ))}
      </div>

      {/* ===== COMO USAR ===== */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
          <Smartphone className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-gray-900 mb-0.5">Como usar</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Apresente este QR Code no parceiro para validar seus benefícios e
            acumular pontos.
          </p>
        </div>
      </div>

      {/* ===== SALDO ===== */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-white rounded-xl border border-gray-200 text-center">
          <p className="text-3xl font-extrabold text-blue-600">
            {Number(assinante.points || 0).toFixed(0)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Pontos</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200 text-center">
          <p className="text-3xl font-extrabold text-green-600">
            {formatCurrency(assinante.cashback || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Cashback</p>
        </div>
      </div>

      {/* ===== TRANSAÇÕES ===== */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <History className="h-4 w-4 text-gray-400" />
            Últimas Transações
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {transactions && transactions.length > 0 ? (
            transactions.slice(0, 10).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      tx.type === 'PURCHASE' ? 'bg-blue-50' : 'bg-green-50'
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
                    {formatCurrency(tx.amount)}
                  </p>
                  {tx.cashbackGenerated > 0 && (
                    <p className="text-[11px] text-green-600 font-medium">
                      +{formatCurrency(tx.cashbackGenerated)}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <History className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nenhuma transação ainda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
