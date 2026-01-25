'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Mail, ArrowRight, Loader2, PartyPopper, Gift } from 'lucide-react'

function CheckoutSucessoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const paymentId = searchParams.get('payment')
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)

  useEffect(() => {
    if (paymentId) {
      checkStatus()
    } else {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId])

  const checkStatus = async () => {
    try {
      const response = await fetch(`/api/checkout/asaas/status/${paymentId}`)
      const data = await response.json()
      setPaymentStatus(data.status)
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      {/* Confetes animados */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 animate-bounce delay-100">
          <PartyPopper className="h-8 w-8 text-yellow-500 opacity-60" />
        </div>
        <div className="absolute top-20 right-20 animate-bounce delay-300">
          <Gift className="h-6 w-6 text-purple-500 opacity-60" />
        </div>
        <div className="absolute bottom-32 left-1/4 animate-bounce delay-500">
          <PartyPopper className="h-6 w-6 text-pink-500 opacity-60" />
        </div>
        <div className="absolute top-1/3 right-1/4 animate-bounce delay-700">
          <Gift className="h-8 w-8 text-blue-500 opacity-60" />
        </div>
      </div>

      <Card className="max-w-md w-full shadow-2xl border-0 overflow-hidden">
        <CardHeader className="text-center pb-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white pt-8 pb-6">
          <div className="mx-auto w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 shadow-lg">
            <CheckCircle2 className="h-14 w-14 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">
            Pagamento Confirmado!
          </CardTitle>
          <p className="text-green-100 mt-2">
            Bem-vindo ao clube de benefícios
          </p>
        </CardHeader>

        <CardContent className="text-center space-y-6 p-6">
          <p className="text-gray-600">
            Seu pagamento foi processado com sucesso e sua assinatura já está <span className="font-semibold text-green-600">ativa</span>!
          </p>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 space-y-3 border border-green-100">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <Mail className="h-5 w-5" />
              <span className="font-semibold">Verifique seu email</span>
            </div>
            <p className="text-sm text-green-600">
              Enviamos seus dados de acesso para o email cadastrado. 
              Verifique também a pasta de spam.
            </p>
          </div>

          {paymentStatus && (
            <div className="text-sm text-gray-500">
              Status: <span className="font-medium text-green-600">{paymentStatus}</span>
            </div>
          )}

          <div className="space-y-3 pt-4">
            <Button 
              className="w-full h-12 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-200" 
              size="lg"
              onClick={() => router.push('/login')}
            >
              Acessar minha conta
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button 
              variant="outline" 
              className="w-full h-11 border-2"
              onClick={() => router.push('/')}
            >
              Voltar ao início
            </Button>
          </div>

          <p className="text-xs text-gray-400 pt-4">
            Em caso de dúvidas, entre em contato pelo WhatsApp
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutSucessoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    }>
      <CheckoutSucessoContent />
    </Suspense>
  )
}

