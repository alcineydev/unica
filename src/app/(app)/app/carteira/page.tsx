'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  QrCode,
  RefreshCw,
  Share2,
  Download,
  Crown,
  CheckCircle,
  AlertCircle,
  Smartphone,
  History,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard
} from 'lucide-react'
import { toast } from 'sonner'

interface Transaction {
  id: string
  amount: number
  pointsUsed: number
  cashbackGenerated: number
  type: string
  status: string
  createdAt: string
  parceiro: {
    companyName: string
    tradeName: string
  }
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
    plan: {
      name: string
    } | null
  }
  transactions: Transaction[]
}

export default function CarteiraPage() {
  const { data: session } = useSession()
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
        // Usuário cancelou ou erro
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

      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `carteira-unica-${data?.assinante?.name?.replace(/\s+/g, '-').toLowerCase() || 'assinante'}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    toast.success('QR Code baixado!')
  }

  const getStatusInfo = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return { label: 'Ativo', color: 'bg-green-500', icon: CheckCircle }
      case 'PENDING':
        return { label: 'Pendente', color: 'bg-yellow-500', icon: AlertCircle }
      case 'INACTIVE':
        return { label: 'Inativo', color: 'bg-gray-500', icon: AlertCircle }
      case 'CANCELLED':
        return { label: 'Cancelado', color: 'bg-red-500', icon: AlertCircle }
      default:
        return { label: 'Ativo', color: 'bg-green-500', icon: CheckCircle }
    }
  }

  const maskCPF = (cpf: string) => {
    if (!cpf || cpf.length !== 11) return '***.***.***-**'
    return `${cpf.slice(0, 3)}.***.**-${cpf.slice(-2)}`
  }

  const formatCPF = (cpf: string) => {
    if (!cpf) return ''
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <Skeleton className="h-[500px] rounded-3xl" />
      </div>
    )
  }

  if (!data?.assinante) {
    return (
      <div className="text-center py-12">
        <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Carteira não disponível</h2>
        <p className="text-muted-foreground">
          Não foi possível carregar sua carteira
        </p>
        <Button onClick={fetchCarteira} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    )
  }

  const { assinante, transactions } = data
  const statusInfo = getStatusInfo(assinante.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">Minha Carteirinha</h1>
        <p className="text-muted-foreground">
          Apresente o QR Code nos parceiros
        </p>
      </div>

      {/* Cartão Digital */}
      <div className="relative overflow-hidden rounded-xl">
        <Card className="overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white border-0 shadow-2xl">
          {/* Decoração - contida no overflow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

          <CardContent className="relative p-6 space-y-6">
            {/* Header do cartão */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-zinc-900 font-bold text-lg">U</span>
                </div>
                <div>
                  <p className="font-bold text-lg">UNICA</p>
                  <p className="text-xs text-zinc-400">Clube de Benefícios</p>
                </div>
              </div>
              <Badge className={`${statusInfo.color} text-white border-0`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>

            {/* QR Code */}
            <div className="flex justify-center py-4">
              <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-lg">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={assinante.qrCode || 'UNICA'}
                  size={160}
                  level="H"
                  includeMargin={false}
                  className="w-full max-w-[160px] sm:max-w-[180px] h-auto"
                />
              </div>
            </div>

            {/* Código textual */}
            <div className="text-center">
              <p className="text-xs text-zinc-400 mb-1">Código da carteira</p>
              <p className="font-mono text-sm tracking-wider">{assinante.qrCode}</p>
            </div>

            {/* Dados do usuário */}
            <div className="flex items-center gap-4 pt-4 border-t border-zinc-700">
              <Avatar className="h-14 w-14 border-2 border-zinc-700">
                <AvatarImage src={assinante.avatar} />
                <AvatarFallback className="bg-zinc-700 text-white text-lg">
                  {assinante.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg truncate">{assinante.name}</p>
                <p className="text-sm text-zinc-400">CPF: {maskCPF(assinante.cpf || '')}</p>
              </div>
            </div>

            {/* Plano */}
            {assinante.plan && (
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <span className="text-sm">Plano</span>
                </div>
                <span className="font-semibold">{assinante.plan.name}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="flex flex-col h-auto py-4 gap-2"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-xs">Atualizar</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col h-auto py-4 gap-2"
          onClick={handleShare}
        >
          <Share2 className="h-5 w-5" />
          <span className="text-xs">Compartilhar</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col h-auto py-4 gap-2"
          onClick={handleDownload}
        >
          <Download className="h-5 w-5" />
          <span className="text-xs">Baixar</span>
        </Button>
      </div>

      {/* Instruções */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Como usar</h3>
              <p className="text-sm text-muted-foreground">
                Apresente este QR Code no estabelecimento parceiro para validar seus benefícios e acumular pontos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saldo */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{Number(assinante.points || 0).toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">Pontos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(assinante.cashback || 0)}
            </p>
            <p className="text-sm text-muted-foreground">Cashback</p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Transações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Últimas Transações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${
                      tx.type === 'PURCHASE'
                        ? 'bg-blue-500/10'
                        : 'bg-green-500/10'
                    }`}>
                      {tx.type === 'PURCHASE' ? (
                        <ArrowDownRight className="h-4 w-4 text-blue-500" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {tx.parceiro?.tradeName || tx.parceiro?.companyName || 'Transação'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      {formatCurrency(tx.amount)}
                    </p>
                    {tx.pointsUsed > 0 && (
                      <p className="text-xs text-yellow-600">
                        -{Number(tx.pointsUsed || 0).toFixed(0)} pts
                      </p>
                    )}
                    {tx.cashbackGenerated > 0 && (
                      <p className="text-xs text-green-600">
                        +{formatCurrency(tx.cashbackGenerated)} cb
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Nenhuma transação ainda
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
