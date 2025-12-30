'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { QRCodeSVG } from 'qrcode.react'
import { AppHeader } from '@/components/app/app-header'
import {
  CreditCard,
  Shield,
  Calendar,
  User,
  Sparkles,
  Share2,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CarteirinhaData {
  id: string
  odontogram: string
  nome: string
  email: string
  image: string | null
  plano: string
  status: string
  validadeAssinatura: string | null
}

export default function CarteirinhaPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<CarteirinhaData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showQR, setShowQR] = useState(true)

  useEffect(() => {
    fetchCarteirinhaData()
  }, [])

  const fetchCarteirinhaData = async () => {
    try {
      const response = await fetch('/api/app/carteirinha')
      const result = await response.json()

      if (result.error) {
        toast.error(result.error)
        return
      }

      setData(result.data)
    } catch (error) {
      console.error('Erro ao carregar carteirinha:', error)
      toast.error('Erro ao carregar carteirinha')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <AppHeader showLocation={false} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto mb-4" />
            <p className="text-slate-500">Carregando carteirinha...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen">
        <AppHeader showLocation={false} />
        <div className="px-4 py-8 text-center">
          <CreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Carteirinha não disponível</h2>
          <p className="text-slate-500">Você precisa ter um plano ativo para acessar sua carteirinha.</p>
        </div>
      </div>
    )
  }

  const isActive = data.status === 'ACTIVE'
  const validade = data.validadeAssinatura
    ? new Date(data.validadeAssinatura).toLocaleDateString('pt-BR')
    : 'Não definida'

  // Gerar dados para o QR Code
  const qrData = JSON.stringify({
    type: 'UNICA_ASSINANTE',
    id: data.id,
    cpf: data.odontogram,
    timestamp: Date.now(),
  })

  const formatCPF = (cpf: string) => {
    if (!cpf) return '---'
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Minha Carteirinha UNICA',
        text: `Sou assinante do ${data.plano} no UNICA Clube de Benefícios!`,
        url: window.location.href
      })
    } catch {
      toast.info('Compartilhamento não disponível')
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader showLocation={false} />

      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Carteirinha Digital</h1>
          <p className="text-slate-500">Apresente para obter seus descontos</p>
        </div>

        {/* Carteirinha Principal */}
        <div className="relative">
          <div className={cn(
            "rounded-3xl p-6 text-white relative overflow-hidden",
            isActive
              ? "bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800"
              : "bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700"
          )}>
            {/* Padrão decorativo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>

            {/* Conteúdo */}
            <div className="relative z-10">
              {/* Logo e Status */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">U</span>
                  </div>
                  <div>
                    <span className="font-bold text-lg">UNICA</span>
                    <span className="text-white/70 text-xs block">Clube de Benefícios</span>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold",
                  isActive ? "bg-emerald-500" : "bg-red-500"
                )}>
                  {isActive ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      ATIVO
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" />
                      INATIVO
                    </>
                  )}
                </div>
              </div>

              {/* QR Code ou Info */}
              <div className="flex justify-center mb-6">
                {showQR ? (
                  <div className="bg-white p-4 rounded-2xl">
                    <QRCodeSVG
                      value={qrData}
                      size={160}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                ) : (
                  <div className="w-44 h-44 bg-white/10 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-3xl font-bold">{data.nome.charAt(0)}</span>
                      </div>
                      <p className="text-sm opacity-90">{data.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Nome e Plano */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">{data.nome}</h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-white/90">{data.plano}</span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-white/70" />
                  <div>
                    <p className="text-xs text-white/70">CPF</p>
                    <p className="text-sm font-medium">{formatCPF(data.odontogram)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white/70" />
                  <div>
                    <p className="text-xs text-white/70">Validade</p>
                    <p className="text-sm font-medium">{validade}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Toggle QR / Foto */}
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setShowQR(true)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                showQR
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600"
              )}
            >
              QR Code
            </button>
            <button
              onClick={() => setShowQR(false)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                !showQR
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600"
              )}
            >
              Informações
            </button>
          </div>
        </div>

        {/* Ações */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all"
          >
            <Share2 className="w-5 h-5" />
            Compartilhar
          </button>
          <button
            onClick={() => toast.info('Em breve!')}
            className="flex items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all"
          >
            <Download className="w-5 h-5" />
            Baixar PDF
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-2xl p-4 flex gap-3">
          <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-900">Como usar</p>
            <p className="text-sm text-blue-700 mt-1">
              Apresente o QR Code ao parceiro para validar sua assinatura e obter os descontos exclusivos do seu plano.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
