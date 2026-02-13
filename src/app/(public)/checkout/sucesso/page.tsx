'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Crown, ArrowRight, Sparkles, PartyPopper } from 'lucide-react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    if (paymentId) {
      fetch(`/api/checkout/asaas/status/${paymentId}`)
        .then(res => res.json())
        .then(data => setStatus(data.status))
        .catch(() => {})
    }
  }, [paymentId])

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background dark:from-green-950/20 flex items-center justify-center p-4">
      {/* Confetti effect via CSS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20 + 5}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              fontSize: `${12 + Math.random() * 16}px`,
              opacity: 0.6 + Math.random() * 0.4,
            }}
          >
            {['🎉', '🎊', '✨', '⭐', '🌟'][Math.floor(Math.random() * 5)]}
          </div>
        ))}
      </div>

      <Card className="max-w-md w-full relative z-10 border-green-200">
        <CardContent className="py-10 text-center">
          {/* Icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30" />
            <div className="relative w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <PartyPopper className="h-5 w-5 text-amber-500" />
            <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">
              Parabéns!
            </h1>
            <PartyPopper className="h-5 w-5 text-amber-500 scale-x-[-1]" />
          </div>

          <p className="text-lg text-green-600 dark:text-green-400 font-medium">
            Pagamento confirmado com sucesso!
          </p>

          <p className="text-sm text-muted-foreground mt-3 mb-6">
            Sua assinatura no UNICA Clube de Benefícios foi ativada.
            Agora você tem acesso a todos os benefícios do seu plano!
          </p>

          {status && (
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Status: {status === 'CONFIRMED' || status === 'RECEIVED' ? 'Confirmado' : status}
            </Badge>
          )}

          {/* Cards de próximos passos */}
          <div className="space-y-3 mt-6 text-left">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Crown className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Acesse sua conta</p>
                <p className="text-xs text-muted-foreground">Faça login para começar a usar seus benefícios</p>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col gap-2 mt-6">
            <Button asChild size="lg" className="w-full">
              <Link href="/login">
                Fazer Login
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">Voltar ao Início</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutSucessoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
