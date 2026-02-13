'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Crown, Calendar, Coins, ArrowDownUp, Gift } from 'lucide-react'

interface PlanTabProps {
  assinante: Record<string, unknown>
  formData: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
  saving: boolean
}

export default function SubscriberPlanTab({
  assinante,
  formData,
  onChange,
  saving,
}: PlanTabProps) {
  const plan = assinante.plan as Record<string, unknown> | undefined
  const features = Array.isArray(plan?.features)
    ? (plan.features as string[])
    : []

  const asaasCustomerId = assinante.asaasCustomerId
    ? String(assinante.asaasCustomerId)
    : null
  const asaasSubscriptionId = assinante.asaasSubscriptionId
    ? String(assinante.asaasSubscriptionId)
    : null
  const asaasPaymentId = assinante.asaasPaymentId
    ? String(assinante.asaasPaymentId)
    : null
  const hasAsaas = !!(asaasCustomerId || asaasSubscriptionId || asaasPaymentId)

  return (
    <div className="space-y-6">
      {/* Plano Atual */}
      {!!plan && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="h-4 w-4 text-primary" />
              Plano Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {String(plan.name ?? '')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {String(plan.description ?? '')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  R$ {Number(plan.price ?? 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  /{plan.period === 'YEARLY' ? 'ano' : 'mês'}
                </p>
              </div>
            </div>
            {features.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {features.map((feature, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Datas da Assinatura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Datas da Assinatura
          </CardTitle>
          <CardDescription>
            Controle de vigência e cobrança
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="planStartDate">Início do Plano</Label>
              <Input
                id="planStartDate"
                type="date"
                value={
                  formData.planStartDate
                    ? new Date(String(formData.planStartDate))
                        .toISOString()
                        .split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  onChange({ planStartDate: e.target.value || null })
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="planEndDate">Fim do Plano</Label>
              <Input
                id="planEndDate"
                type="date"
                value={
                  formData.planEndDate
                    ? new Date(String(formData.planEndDate))
                        .toISOString()
                        .split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  onChange({ planEndDate: e.target.value || null })
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextBillingDate">Próxima Cobrança</Label>
              <Input
                id="nextBillingDate"
                type="date"
                value={
                  formData.nextBillingDate
                    ? new Date(String(formData.nextBillingDate))
                        .toISOString()
                        .split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  onChange({ nextBillingDate: e.target.value || null })
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Último Pagamento</Label>
              <Input
                value={
                  assinante.lastPaymentDate
                    ? new Date(
                        String(assinante.lastPaymentDate)
                      ).toLocaleDateString('pt-BR')
                    : 'Nenhum'
                }
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saldo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-4 w-4" />
            Saldo e Recompensas
          </CardTitle>
          <CardDescription>
            Ajuste manual de pontos e cashback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="points" className="flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-blue-600" /> Pontos
              </Label>
              <Input
                id="points"
                type="number"
                step="0.01"
                min="0"
                value={String(formData.points ?? '')}
                onChange={(e) => onChange({ points: e.target.value })}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashback" className="flex items-center gap-1">
                <ArrowDownUp className="h-3.5 w-3.5 text-green-600" /> Cashback
                (R$)
              </Label>
              <Input
                id="cashback"
                type="number"
                step="0.01"
                min="0"
                value={String(formData.cashback ?? '')}
                onChange={(e) => onChange({ cashback: e.target.value })}
                disabled={saving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integração Asaas */}
      {hasAsaas && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Integração Asaas</CardTitle>
            <CardDescription>
              Dados do gateway de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!!asaasCustomerId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer ID</span>
                <code className="text-xs bg-muted px-2 py-0.5 rounded">
                  {asaasCustomerId}
                </code>
              </div>
            )}
            {!!asaasSubscriptionId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscription ID</span>
                <code className="text-xs bg-muted px-2 py-0.5 rounded">
                  {asaasSubscriptionId}
                </code>
              </div>
            )}
            {!!asaasPaymentId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment ID</span>
                <code className="text-xs bg-muted px-2 py-0.5 rounded">
                  {asaasPaymentId}
                </code>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
