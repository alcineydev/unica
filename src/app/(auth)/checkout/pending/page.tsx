'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Home, RefreshCw } from 'lucide-react'

export default function CheckoutPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20 dark:to-background">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-amber-600" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Pagamento Pendente</h1>
          <p className="text-muted-foreground mb-6">
            Seu pagamento está sendo processado. 
            Você receberá uma notificação assim que for confirmado.
          </p>

          <div className="p-4 bg-muted rounded-lg mb-6">
            <p className="text-sm text-muted-foreground">
              <strong>PIX:</strong> O pagamento pode levar alguns minutos para ser confirmado.
              <br />
              <strong>Boleto:</strong> A confirmação pode levar até 2 dias úteis.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/login">
              <Button className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Ir para o Login
              </Button>
            </Link>
            
            <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Verificar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

