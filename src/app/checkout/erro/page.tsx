'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { XCircle, ArrowLeft, RefreshCw, Mail, Phone, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function CheckoutErroPage() {
  const searchParams = useSearchParams()
  const [errorInfo, setErrorInfo] = useState({
    paymentId: '',
    status: '',
    planSlug: '',
  })

  useEffect(() => {
    const paymentId = searchParams.get('payment_id') || ''
    const status = searchParams.get('status') || 'rejected'
    const externalReference = searchParams.get('external_reference')

    let planSlug = ''
    if (externalReference) {
      try {
        const data = JSON.parse(externalReference)
        planSlug = data.planSlug || ''
      } catch {
        // Ignorar erro de parse
      }
    }

    setErrorInfo({ paymentId, status, planSlug })
  }, [searchParams])

  function getErrorMessage(status: string): string {
    switch (status) {
      case 'rejected':
        return 'O pagamento foi recusado pela operadora do cartão.'
      case 'cancelled':
        return 'O pagamento foi cancelado.'
      case 'refunded':
        return 'O pagamento foi reembolsado.'
      case 'charged_back':
        return 'Houve uma contestação do pagamento.'
      default:
        return 'Ocorreu um erro durante o processamento do pagamento.'
    }
  }

  function getErrorSuggestions(status: string): string[] {
    switch (status) {
      case 'rejected':
        return [
          'Verifique se o cartão possui limite disponível',
          'Confirme se os dados do cartão foram digitados corretamente',
          'Tente usar outro cartão ou forma de pagamento',
          'Entre em contato com seu banco para verificar bloqueios',
        ]
      case 'cancelled':
        return [
          'O pagamento foi cancelado antes de ser concluído',
          'Você pode tentar novamente quando quiser',
        ]
      default:
        return [
          'Tente realizar o pagamento novamente',
          'Use um método de pagamento diferente',
          'Entre em contato com nosso suporte se o problema persistir',
        ]
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl border-red-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-3xl text-red-700">
            Pagamento não aprovado
          </CardTitle>
          <CardDescription className="text-lg">
            {getErrorMessage(errorInfo.status)}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-gray-700" />
              <span className="font-semibold text-gray-800">O que você pode fazer:</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              {getErrorSuggestions(errorInfo.status).map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                    {index + 1}
                  </span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {errorInfo.paymentId && (
            <>
              <Separator />
              <div className="text-center text-sm text-muted-foreground">
                <p>Referência: <span className="font-mono font-medium">{errorInfo.paymentId}</span></p>
              </div>
            </>
          )}

          <Separator />

          <div className="grid gap-3">
            {errorInfo.planSlug ? (
              <Button asChild className="w-full bg-gray-900 hover:bg-gray-800">
                <Link href={`/checkout/${errorInfo.planSlug}`}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-full bg-gray-900 hover:bg-gray-800">
                <Link href="/planos">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Ver planos disponíveis
                </Link>
              </Button>
            )}
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
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
