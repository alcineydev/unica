'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2, Crown, ArrowRight, Sparkles, PartyPopper,
  Clock, AlertCircle, Loader2, Copy, Check, Download,
  Mail, FileText, QrCode, CreditCard
} from 'lucide-react'
import { toast } from 'sonner'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const paymentId = searchParams.get('paymentId')
  const method = searchParams.get('method') || 'PIX'

  const [status, setStatus] = useState<string>('PENDING')
  const [loading, setLoading] = useState(true)
  const [pollCount, setPollCount] = useState(0)
  const [boletoData, setBoletoData] = useState<{
    bankSlipUrl?: string
    identificationField?: string
    dueDate?: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxPolls = 60 // 5 minutos (a cada 5s)

  const checkStatus = useCallback(async () => {
    if (!paymentId) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`/api/checkout/asaas/status/${paymentId}`)
      const data = await res.json()
      const paymentStatus = data.status || data.payment?.status || 'PENDING'
      setStatus(paymentStatus)

      // Salvar dados do boleto se houver
      if (data.payment?.bankSlipUrl || data.bankSlipUrl) {
        setBoletoData({
          bankSlipUrl: data.payment?.bankSlipUrl || data.bankSlipUrl,
          identificationField: data.payment?.identificationField || data.identificationField,
          dueDate: data.payment?.dueDate || data.dueDate,
        })
      }

      // Se confirmado, redirecionar para o app
      if (paymentStatus === 'CONFIRMED' || paymentStatus === 'RECEIVED') {
        setRedirecting(true)
        if (pollRef.current) clearInterval(pollRef.current)

        setTimeout(() => {
          router.push('/login?redirect=/app/perfil')
        }, 3000)
      }

      setPollCount(prev => prev + 1)
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }, [paymentId, router])

  useEffect(() => {
    checkStatus()

    // Polling para PIX e Cartão (não para boleto)
    if (method !== 'BOLETO') {
      pollRef.current = setInterval(() => {
        setPollCount(prev => {
          if (prev >= maxPolls) {
            if (pollRef.current) clearInterval(pollRef.current)
            return prev
          }
          checkStatus()
          return prev
        })
      }, 5000)
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method])

  const isConfirmed = status === 'CONFIRMED' || status === 'RECEIVED'
  const isBoleto = method === 'BOLETO'

  const copyBarcode = () => {
    if (boletoData?.identificationField) {
      navigator.clipboard.writeText(boletoData.identificationField)
      setCopied(true)
      toast.success('Código copiado!')
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const progressPercent = Math.min((pollCount / maxPolls) * 100, 95)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-violet-500" />
          <p className="text-sm text-muted-foreground mt-4">Verificando seu pagamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isConfirmed
        ? 'bg-gradient-to-b from-green-50 to-background dark:from-green-950/20'
        : isBoleto
          ? 'bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20'
          : 'bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20'
    }`}>

      {/* Confetti quando confirmado */}
      {isConfirmed && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20 + 5}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                fontSize: `${14 + Math.random() * 18}px`,
                opacity: 0.7 + Math.random() * 0.3,
              }}
            >
              {['🎉', '🎊', '✨', '⭐', '🌟', '🥳'][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>
      )}

      <Card className={`max-w-md w-full relative z-10 ${
        isConfirmed ? 'border-green-200' : isBoleto ? 'border-amber-200' : 'border-violet-200'
      }`}>
        <CardContent className="py-8 px-6">

          {/* CONFIRMADO (PIX/Cartão) */}
          {isConfirmed && (
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30" />
                <div className="relative w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-2">
                <PartyPopper className="h-5 w-5 text-amber-500" />
                <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">Parabéns!</h1>
                <PartyPopper className="h-5 w-5 text-amber-500 scale-x-[-1]" />
              </div>

              <p className="text-lg text-green-600 font-medium mb-2">Pagamento confirmado!</p>
              <p className="text-sm text-muted-foreground mb-6">
                Sua assinatura foi ativada com sucesso. Enviamos seus dados de acesso por email.
              </p>

              {redirecting && (
                <div className="space-y-3 mb-6">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <Sparkles className="h-3 w-3 mr-1" /> Plano Ativo
                  </Badge>
                  <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Redirecionando para seu perfil...</span>
                  </div>
                  <Progress value={100} className="h-1.5" />
                </div>
              )}

              <Button size="lg" className="w-full" onClick={() => router.push('/login?redirect=/app/perfil')}>
                <Crown className="h-4 w-4 mr-2" />
                Acessar Meu Perfil
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* BOLETO - Orientações */}
          {isBoleto && !isConfirmed && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-amber-600" />
                </div>
                <h1 className="text-xl font-bold mb-1">Boleto Gerado!</h1>
                <p className="text-sm text-muted-foreground">
                  Pague o boleto para ativar sua assinatura
                </p>
              </div>

              {/* Código de barras */}
              {boletoData?.identificationField && (
                <div className="mb-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Código de Barras
                  </span>
                  <div className="bg-muted rounded-lg p-3 text-xs font-mono break-all mb-2 max-h-20 overflow-y-auto">
                    {boletoData.identificationField}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={copyBarcode}
                  >
                    {copied ? (
                      <><Check className="h-4 w-4 mr-2 text-green-500" /> Copiado!</>
                    ) : (
                      <><Copy className="h-4 w-4 mr-2" /> Copiar Código de Barras</>
                    )}
                  </Button>
                </div>
              )}

              {/* Vencimento */}
              {boletoData?.dueDate && (
                <div className="flex items-center justify-center gap-2 text-sm text-amber-600 mb-4">
                  <Clock className="h-4 w-4" />
                  <span>Vencimento: {new Date(boletoData.dueDate).toLocaleDateString('pt-BR')}</span>
                </div>
              )}

              {/* Botões */}
              <div className="space-y-2 mb-6">
                {boletoData?.bankSlipUrl && (
                  <Button className="w-full" asChild>
                    <a href={boletoData.bankSlipUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Boleto (PDF)
                    </a>
                  </Button>
                )}
              </div>

              {/* Orientações */}
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Próximos passos
                </h3>
                <div className="text-xs text-amber-600 space-y-2">
                  <p>1. Copie o código de barras ou baixe o PDF do boleto</p>
                  <p>2. Pague pelo app do seu banco ou em qualquer lotérica</p>
                  <p>3. Após a compensação (1-3 dias úteis), sua assinatura será ativada automaticamente</p>
                  <p>4. Você receberá um email de confirmação assim que o pagamento for processado</p>
                </div>
              </div>

              {/* Info email */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center mb-4">
                <Mail className="h-3.5 w-3.5" />
                <span>Enviamos os dados do boleto e suas credenciais por email</span>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <Link href="/login?redirect=/app">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Ir para Login
                </Link>
              </Button>
            </div>
          )}

          {/* AGUARDANDO (PIX/Cartão) */}
          {!isConfirmed && !isBoleto && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-violet-100 rounded-full animate-pulse" />
                <div className="relative w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center">
                  {method === 'PIX' ? (
                    <QrCode className="h-8 w-8 text-violet-600" />
                  ) : (
                    <CreditCard className="h-8 w-8 text-violet-600" />
                  )}
                </div>
              </div>

              <h1 className="text-xl font-bold mb-2">
                {method === 'PIX' ? 'Aguardando Pagamento PIX' : 'Processando Pagamento'}
              </h1>

              <p className="text-sm text-muted-foreground mb-6">
                {method === 'PIX'
                  ? 'Assim que identificarmos seu PIX, sua conta será ativada automaticamente.'
                  : 'Estamos processando seu pagamento. Isso pode levar alguns instantes.'
                }
              </p>

              {/* Progress bar */}
              <div className="mb-6">
                <Progress value={progressPercent} className="h-2 mb-2" />
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Verificando pagamento... ({Math.floor(pollCount * 5 / 60)}:{String((pollCount * 5) % 60).padStart(2, '0')})</span>
                </div>
              </div>

              {/* Timer info */}
              <div className="bg-violet-50 dark:bg-violet-950/20 rounded-xl p-4 mb-6 text-sm text-violet-600">
                {method === 'PIX' ? (
                  <p>O PIX é identificado em segundos. Se já pagou, aguarde a confirmação automática.</p>
                ) : (
                  <p>O processamento do cartão pode levar até 1 minuto. Não feche esta página.</p>
                )}
              </div>

              <Button variant="outline" className="w-full" onClick={() => checkStatus()}>
                <Loader2 className="h-4 w-4 mr-2" />
                Verificar Novamente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutSucessoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-background">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
