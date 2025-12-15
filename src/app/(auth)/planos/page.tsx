'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Check, 
  ArrowLeft, 
  Loader2,
  Gift,
  Star,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  yearlyPrice?: number
  features: string[]
  isPopular?: boolean
}

export default function PlanosPublicPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/public/plans')
      const data = await response.json()
      
      if (data.plans) {
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPlan = (planId: string) => {
    router.push(`/cadastro?plano=${planId}`)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Login
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Gift className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold">UNICA</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="mb-4">Escolha seu plano</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Comece a Economizar Hoje
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para você e tenha acesso a descontos exclusivos 
            em centenas de parceiros.
          </p>
        </div>

        {/* Plans Grid */}
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum plano disponível no momento.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan, index) => {
              const isPopular = index === 1 || plan.isPopular
              
              return (
                <Card 
                  key={plan.id} 
                  className={cn(
                    "relative overflow-hidden transition-all hover:shadow-lg",
                    isPopular && "border-primary shadow-lg scale-105"
                  )}
                >
                  {isPopular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                      <Star className="inline h-3 w-3 mr-1" />
                      Mais Popular
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Price */}
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                        <span className="text-muted-foreground">/mês</span>
                      </div>
                      {plan.yearlyPrice && (
                        <p className="text-sm text-muted-foreground mt-1">
                          ou {formatPrice(plan.yearlyPrice)}/ano (economia de 2 meses)
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3">
                      {plan.features?.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button 
                      className="w-full"
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Escolher {plan.name}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">Pagamento seguro via</p>
          <div className="flex items-center justify-center gap-6 opacity-60">
            <span className="font-semibold">Mercado Pago</span>
            <span className="font-semibold">PIX</span>
            <span className="font-semibold">Cartão</span>
          </div>
        </div>
      </main>
    </div>
  )
}

