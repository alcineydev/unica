'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Clock, ArrowRight, Mail, Phone, Copy, Check, FileText, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface PaymentInfo {
  paymentId: string
  status: string
  email: string
  paymentType: string
}

function PendenteContent() {
  const searchParams = useSearchParams()
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    paymentId: '',
    status: '',
    email: '',
    paymentType: '',
  })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const paymentId = searchParams.get('payment_id') || ''
    const status = searchParams.get('status') || 'pending'
    const externalReference = searchParams.get('external_reference')

    let email = ''
    let paymentType = ''
    if (externalReference) {
      try {
        const data = JSON.parse(externalReference)
        email = data.email || ''
        paymentType = data.paymentType || ''
      } catch {
        // Ignorar erro de parse
      }
    }

    setPaymentInfo({ paymentId, status, email, paymentType })
  }, [searchParams])

  function copyPaymentId() {
    if (paymentInfo.paymentId) {
      navigator.clipboard.writeText(paymentInfo.paymentId)
      setCopied(true)
      toast.success('Código copiado!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function getStatusMessage(status: string): { title: string; description: string } {
    switch (status) {
      case 'in_process':
        return {
          title: 'Pagamento em análise',
          description: 'Seu pagamento está sendo processado e será confirmado em breve.',
        }
      case 'pending':
        return {
          title: 'Pagamento pendente',
          description: 'Aguardando confirmação do pagamento.',
        }
      default:
        return {
          title: 'Aguardando pagamento',
          description: 'Complete o pagamento para ativar sua assinatura.',
        }
    }
  }

  const statusInfo = getStatusMessage(paymentInfo.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl border-gray-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-12 w-12 text-gray-600" />
          </div>
          <CardTitle className="text-3xl text-gray-900">
            {statusInfo.title}
          </CardTitle>
          <CardDescription className="text-lg">
            {statusInfo.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Próximos passos</span>
            </div>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start gap-2">
                <span className="bg-blue-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                <span>Se você escolheu boleto ou PIX, complete o pagamento no prazo indicado.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                <span>Assim que o pagamento for confirmado, você receberá um e-mail.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                <span>A liberação do acesso ocorre em até 24 horas após a confirmação.</span>
              </li>
            </ul>
          </div>

          {paymentInfo.paymentId && (
            <>
              <Separator />
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Código do pagamento</p>
                    <p className="font-mono font-medium text-lg">{paymentInfo.paymentId}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPaymentId}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {paymentInfo.email && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Confirmação será enviada para: <span className="font-medium">{paymentInfo.email}</span>
                  </p>
                )}
              </div>
            </>
          )}

          <Separator />

          <div className="grid gap-3">
            <Button asChild className="w-full bg-gray-900 hover:bg-gray-800">
              <Link href="/">
                <ArrowRight className="h-4 w-4 mr-2" />
                Ir para a página inicial
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/planos">
                <FileText className="h-4 w-4 mr-2" />
                Ver outros planos
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
    </div>
  )
}

export default function CheckoutPendentePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PendenteContent />
    </Suspense>
  )
}
