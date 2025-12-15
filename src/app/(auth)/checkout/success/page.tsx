'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Gift, ArrowRight } from 'lucide-react'

export default function CheckoutSuccessPage() {
  useEffect(() => {
    // Animação de confetti simples com CSS
    const createConfetti = () => {
      const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']
      const container = document.getElementById('confetti-container')
      
      if (!container) return

      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div')
        confetti.className = 'confetti'
        confetti.style.cssText = `
          position: absolute;
          width: 10px;
          height: 10px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          left: ${Math.random() * 100}%;
          top: -10px;
          opacity: ${Math.random() + 0.5};
          transform: rotate(${Math.random() * 360}deg);
          animation: fall ${Math.random() * 3 + 2}s linear forwards;
        `
        container.appendChild(confetti)
        
        setTimeout(() => confetti.remove(), 5000)
      }
    }

    createConfetti()
  }, [])

  return (
    <>
      <style jsx global>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-green-50 to-background dark:from-green-950/20 dark:to-background relative overflow-hidden">
        <div id="confetti-container" className="absolute inset-0 pointer-events-none" />
        
        <Card className="max-w-md w-full relative z-10">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Pagamento Aprovado!</h1>
            <p className="text-muted-foreground mb-6">
              Sua assinatura UNICA foi ativada com sucesso.
              Agora você tem acesso a todos os benefícios!
            </p>

            <div className="p-4 bg-muted rounded-lg mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="h-5 w-5 text-primary" />
                <span className="font-semibold">Próximos passos</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Faça login para acessar sua carteirinha digital e começar a economizar!
              </p>
            </div>

            <Link href="/login">
              <Button className="w-full">
                Acessar Minha Conta
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

