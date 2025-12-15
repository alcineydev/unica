'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { XCircle, ArrowLeft, MessageCircle } from 'lucide-react'

export default function CheckoutFailurePage() {
  const handleContactSupport = () => {
    // Abrir WhatsApp de suporte
    window.open('https://wa.me/5566999999999?text=Olá, tive um problema com meu pagamento na UNICA', '_blank')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-red-50 to-background dark:from-red-950/20 dark:to-background">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Pagamento não aprovado</h1>
          <p className="text-muted-foreground mb-6">
            Houve um problema com seu pagamento. 
            Por favor, tente novamente ou escolha outra forma de pagamento.
          </p>

          <div className="space-y-3">
            <Link href="/planos">
              <Button className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
            </Link>
            
            <Button variant="outline" className="w-full" onClick={handleContactSupport}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Falar com Suporte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

