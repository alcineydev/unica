'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Crown, Shield, Check, Lock } from 'lucide-react'

interface PlanSummaryProps {
  plan: {
    name: string
    description?: string
    price: number
    period?: string
    features?: string[]
    planBenefits?: Array<{ benefit?: { name?: string } }>
  }
}

export default function CheckoutPlanSummary({ plan }: PlanSummaryProps) {
  const price = Number(plan.price)
  const periodLabel = plan.period === 'YEARLY' ? '/ano' : plan.period === 'SINGLE' ? ' único' : '/mês'

  // Extrair features do plano ou dos benefícios
  const featureList: string[] = []
  if (plan.features && plan.features.length > 0) {
    featureList.push(...plan.features)
  } else if (plan.planBenefits && plan.planBenefits.length > 0) {
    plan.planBenefits.forEach((pb) => {
      if (pb.benefit?.name) featureList.push(pb.benefit.name)
    })
  }

  return (
    <Card className="border-primary/20 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/90 to-primary p-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Crown className="h-5 w-5" />
          <span className="text-sm font-medium text-white/80">Plano selecionado</span>
        </div>
        <h3 className="text-xl font-bold">{plan.name}</h3>
        {plan.description && (
          <p className="text-sm text-white/70 mt-1">{plan.description}</p>
        )}
      </div>

      <CardContent className="pt-4">
        {/* Preço */}
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-3xl font-bold">R$ {price.toFixed(2).replace('.', ',')}</span>
          <span className="text-sm text-muted-foreground">{periodLabel}</span>
        </div>

        {/* Features */}
        {featureList.length > 0 && (
          <>
            <Separator className="mb-3" />
            <div className="space-y-2">
              {featureList.slice(0, 5).map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
              {featureList.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{featureList.length - 5} benefícios inclusos
                </p>
              )}
            </div>
          </>
        )}

        {/* Trust badges */}
        <Separator className="my-3" />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-green-600" />
            <span>Pagamento seguro</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="h-3.5 w-3.5 text-green-600" />
            <span>Dados criptografados</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
