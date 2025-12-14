// Forçar página dinâmica - sem cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Check, Sparkles, ArrowRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Benefit {
  id: string
  name: string
  type: string
}

interface PlanBenefit {
  benefit: Benefit
}

interface Plan {
  id: string
  name: string
  description: string
  slug: string | null
  price: number
  priceMonthly: number | null
  priceYearly: number | null
  priceSingle: number | null
  planBenefits: PlanBenefit[]
}

async function getPlans(): Promise<Plan[]> {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      include: {
        planBenefits: {
          include: {
            benefit: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    })

    return plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      slug: plan.slug,
      price: Number(plan.price),
      priceMonthly: plan.priceMonthly ? Number(plan.priceMonthly) : null,
      priceYearly: plan.priceYearly ? Number(plan.priceYearly) : null,
      priceSingle: plan.priceSingle ? Number(plan.priceSingle) : null,
      planBenefits: plan.planBenefits,
    }))
  } catch (error) {
    console.error('Erro ao buscar planos:', error)
    return []
  }
}

function formatPrice(price: number | null): string {
  if (!price) return 'R$ 0,00'
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function PlanosPage() {
  const plans = await getPlans()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-gray-900" />
            <span className="font-bold text-xl text-gray-900">Unica</span>
          </Link>
          <Link href="/login">
            <Button variant="outline">Entrar</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gray-100 text-gray-800 hover:bg-gray-100">
            <Star className="h-3 w-3 mr-1" />
            Clube de Benefícios
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tenha acesso a descontos exclusivos, cashback e muito mais em centenas de parceiros.
            Escolha o plano ideal para você.
          </p>
        </div>

        {/* Planos */}
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum plano disponível no momento.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => {
              const isPopular = index === 1 // Destaca o segundo plano como popular
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative flex flex-col ${
                    isPopular 
                      ? 'border-gray-900 border-2 shadow-lg scale-105' 
                      : 'border-gray-200'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gray-900 hover:bg-gray-900 text-white">
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl text-gray-900">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    {/* Preço */}
                    <div className="text-center mb-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-gray-900">
                          {formatPrice(plan.priceMonthly || plan.price)}
                        </span>
                        <span className="text-muted-foreground">/mês</span>
                      </div>
                      {plan.priceYearly && (
                        <p className="text-sm text-green-600 mt-1">
                          ou {formatPrice(plan.priceYearly)}/ano
                        </p>
                      )}
                    </div>

                    {/* Benefícios */}
                    <ul className="space-y-3">
                      {plan.planBenefits.slice(0, 5).map((pb) => (
                        <li key={pb.benefit.id} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>{pb.benefit.name}</span>
                        </li>
                      ))}
                      {plan.planBenefits.length > 5 && (
                        <li className="text-sm text-muted-foreground pl-6">
                          +{plan.planBenefits.length - 5} benefícios
                        </li>
                      )}
                    </ul>
                  </CardContent>
                  
                  <CardFooter>
                    {plan.slug ? (
                      <Button 
                        asChild 
                        className={`w-full ${
                          isPopular 
                            ? 'bg-gray-900 hover:bg-gray-800' 
                            : 'bg-gray-900 hover:bg-gray-800'
                        }`}
                      >
                        <Link href={`/checkout/${plan.slug}`}>
                          Assinar agora
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-gray-400 cursor-not-allowed" 
                        disabled
                      >
                        Em breve
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}

        {/* FAQ ou informações adicionais */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ainda tem dúvidas?
          </h2>
          <p className="text-muted-foreground mb-6">
            Entre em contato conosco pelo WhatsApp e tire suas dúvidas.
          </p>
          <Button variant="outline" asChild>
            <a href="https://wa.me/5565999999999" target="_blank" rel="noopener noreferrer">
              Falar no WhatsApp
            </a>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Unica Clube de Benefícios. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
