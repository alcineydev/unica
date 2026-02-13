'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QrCode, Copy, Check, Clock, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface PixResultProps {
  pixData: {
    qrCodeImage?: string
    qrCodeText?: string
    expirationDate?: string
  }
  paymentId: string
  onConfirmed: () => void
}

export default function CheckoutPixResult({ pixData, paymentId, onConfirmed }: PixResultProps) {
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [timeLeft, setTimeLeft] = useState(1800) // 30 min

  // Memoize onConfirmed para evitar re-renders no useEffect
  const stableOnConfirmed = useCallback(onConfirmed, [onConfirmed])

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Polling de status
  useEffect(() => {
    if (confirmed || !paymentId) return

    const poll = setInterval(async () => {
      try {
        setChecking(true)
        const res = await fetch(`/api/checkout/asaas/status/${paymentId}`)
        const data = await res.json()
        if (data.status === 'CONFIRMED' || data.status === 'RECEIVED') {
          setConfirmed(true)
          clearInterval(poll)
          stableOnConfirmed()
        }
      } catch {
        // silencioso
      } finally {
        setChecking(false)
      }
    }, 5000)

    return () => clearInterval(poll)
  }, [paymentId, confirmed, stableOnConfirmed])

  const copyCode = () => {
    if (pixData.qrCodeText) {
      navigator.clipboard.writeText(pixData.qrCodeText)
      setCopied(true)
      toast.success('Código PIX copiado!')
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  if (confirmed) {
    return (
      <Card className="border-green-300 bg-green-50 dark:bg-green-950/30">
        <CardContent className="py-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-green-700 dark:text-green-400">Pagamento Confirmado!</h3>
          <p className="text-sm text-green-600 mt-2">Seu plano foi ativado com sucesso.</p>
          <Button className="mt-4" onClick={() => window.location.href = '/login?redirect=/app/perfil'}>
            Acessar Meu Perfil
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-6">
        <div className="text-center mb-4">
          <Badge variant="secondary" className="mb-3">
            <Clock className="h-3 w-3 mr-1" />
            {minutes}:{String(seconds).padStart(2, '0')} restantes
          </Badge>
          <h3 className="text-lg font-bold">Escaneie o QR Code PIX</h3>
          <p className="text-sm text-muted-foreground">Abra o app do seu banco e escaneie o código</p>
        </div>

        {/* QR Code */}
        {pixData.qrCodeImage && (
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${pixData.qrCodeImage}`}
                alt="QR Code PIX"
                className="w-48 h-48"
                width={192}
                height={192}
              />
            </div>
          </div>
        )}

        {/* Copia e Cola */}
        {pixData.qrCodeText && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">Ou copie o código PIX:</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-muted rounded-lg p-3 text-xs font-mono break-all max-h-20 overflow-y-auto">
                {pixData.qrCodeText}
              </div>
              <Button variant="outline" size="icon" onClick={copyCode} className="shrink-0 h-auto">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
          {checking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <QrCode className="h-4 w-4" />
          )}
          <span>Aguardando pagamento...</span>
        </div>
      </CardContent>
    </Card>
  )
}
