'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Mail, Phone, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface PaymentInfo {
  planId?: string
  planName?: string
  paymentType?: string
  email?: string
  paymentId?: string
  status?: string
}

function SucessoContent() {
  const searchParams = useSearchParams()
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({})

  useEffect(() => {
    // Capturar parâmetros do Asaas
    const paymentId = searchParams.get('payment_id')
    const status = searchParams.get('status')
    const externalReference = searchParams.get('external_reference')

    if (externalReference) {
      try {
        const data = JSON.parse(externalReference)
        setPaymentInfo({
          planId: data.planId,
          email: data.email,
          paymentType: data.paymentType,
          paymentId: paymentId || undefined,
          status: status || 'approved',
        })
      } catch {
        setPaymentInfo({
          paymentId: paymentId || undefined,
          status: status || 'approved',
        })
      }
    } else {
      setPaymentInfo({
        paymentId: paymentId || undefined,
        status: status || 'approved',
      })
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl border-green-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl text-green-700">
            Pagamento Aprovado!
          </CardTitle>
          <CardDescription className="text-lg">
            Sua assinatura do Unica Clube de Benefícios foi confirmada.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">O que acontece agora?</span>
            </div>
            <ul className="space-y-2 text-sm text-green-700">
              <li className="flex items-start gap-2">
                <span className="bg-green-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                <span>Você receberá um e-mail de confirmação com os detalhes da sua assinatura.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-green-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                <span>Seu acesso ao clube será liberado em até 24 horas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-green-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                <span>Use o app para aproveitar todos os benefícios exclusivos!</span>
              </li>
            </ul>
          </div>

          {paymentInfo.paymentId && (
            <>
              <Separator />
              <div className="text-center text-sm text-muted-foreground">
                <p>Número do pagamento: <span className="font-mono font-medium">{paymentInfo.paymentId}</span></p>
                {paymentInfo.email && (
                  <p className="mt-1">Confirmação enviada para: <span className="font-medium">{paymentInfo.email}</span></p>
                )}
              </div>
            </>
          )}

          <Separator />

          <div className="grid gap-3">
            <Button asChild className="w-full bg-gray-900 hover:bg-gray-800">
              <Link href="/login">
                <ArrowRight className="h-4 w-4 mr-2" />
                Acessar minha conta
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                Voltar para a página inicial
              </Link>
            </Button>
          </div>

          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground mb-2">Precisa de ajuda?</p>
            <div className="flex justify-center gap-4 text-sm">
              <a href="mailto:suporte@unica.club" className="flex items-center gap-1 text-gray-600 hover:underline">
                <Mail className="h-4 w-4" />
                suporte@unica.club
              </a>
              <a href="tel:+556699999999" className="flex items-center gap-1 text-gray-600 hover:underline">
                <Phone className="h-4 w-4" />
                (66) 9999-9999
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
    </div>
  )
}

export default function CheckoutSucessoPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SucessoContent />
    </Suspense>
  )
}
