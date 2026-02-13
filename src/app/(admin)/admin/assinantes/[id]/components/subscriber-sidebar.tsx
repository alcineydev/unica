'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  User,
  QrCode,
  Calendar,
  CreditCard,
  Coins,
  ArrowDownUp,
  MapPin,
  Copy,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
  id: string
  name: string
  price: number | string
  period?: string
  features?: string[]
}

interface City {
  id: string
  name: string
  state: string
}

interface Stats {
  totalTransactions?: number
  totalSpent?: number
  totalCashback?: number
  totalPointsUsed?: number
  totalDiscounts?: number
}

interface SubscriberSidebarProps {
  assinante: Record<string, unknown>
  plans: Plan[]
  cities: City[]
  stats: Stats
  onUpdate: (data: Record<string, unknown>) => Promise<void>
  saving: boolean
}

const STATUS_MAP: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  ACTIVE: { label: 'Ativo', variant: 'default' },
  PENDING: { label: 'Pendente', variant: 'secondary' },
  INACTIVE: { label: 'Inativo', variant: 'outline' },
  SUSPENDED: { label: 'Suspenso', variant: 'destructive' },
  CANCELED: { label: 'Cancelado', variant: 'destructive' },
  EXPIRED: { label: 'Expirado', variant: 'outline' },
  GUEST: { label: 'Convidado', variant: 'secondary' },
}

export default function SubscriberSidebar({
  assinante,
  plans,
  cities,
  stats,
  onUpdate,
  saving,
}: SubscriberSidebarProps) {
  const [copiedQR, setCopiedQR] = useState(false)

  const user = assinante.user as Record<string, unknown> | undefined
  const plan = assinante.plan as Record<string, unknown> | undefined
  const subscriptionStatus = assinante.subscriptionStatus as string
  const statusInfo = STATUS_MAP[subscriptionStatus] || {
    label: subscriptionStatus,
    variant: 'outline' as const,
  }

  const copyQRCode = () => {
    navigator.clipboard.writeText((assinante.qrCode as string) || '')
    setCopiedQR(true)
    toast.success('QR Code copiado!')
    setTimeout(() => setCopiedQR(false), 2000)
  }

  const memberSince = new Date(
    (user?.createdAt as string) || (assinante.createdAt as string)
  )
  const daysMember = Math.floor(
    (Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="space-y-4">
      {/* Card Perfil */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted mb-3">
              {user?.avatar ? (
                <Image
                  src={user.avatar as string}
                  alt={assinante.name as string}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <User className="h-10 w-10 text-primary/60" />
                </div>
              )}
            </div>

            <h3 className="font-semibold text-lg">
              {assinante.name as string}
            </h3>
            <p className="text-sm text-muted-foreground">
              {user?.email as string}
            </p>

            <Badge variant={statusInfo.variant} className="mt-2">
              {statusInfo.label}
            </Badge>

            {plan && (
              <p className="text-xs text-muted-foreground mt-1">
                Plano:{' '}
                <span className="font-medium">{plan.name as string}</span>
              </p>
            )}
          </div>

          <Separator className="my-4" />

          {/* QR Code */}
          {assinante.qrCode && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <QrCode className="h-3 w-3" /> Código QR
              </Label>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                  {assinante.qrCode as string}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={copyQRCode}
                >
                  {copiedQR ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* Métricas rápidas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <Coins className="h-4 w-4 mx-auto mb-1 text-blue-600" />
              <p className="text-lg font-bold text-blue-600">
                {Number(assinante.points || 0).toFixed(0)}
              </p>
              <p className="text-[10px] text-muted-foreground">Pontos</p>
            </div>
            <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <ArrowDownUp className="h-4 w-4 mx-auto mb-1 text-green-600" />
              <p className="text-lg font-bold text-green-600">
                R$ {Number(assinante.cashback || 0).toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground">Cashback</p>
            </div>
            <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
              <CreditCard className="h-4 w-4 mx-auto mb-1 text-purple-600" />
              <p className="text-lg font-bold text-purple-600">
                {stats?.totalTransactions || 0}
              </p>
              <p className="text-[10px] text-muted-foreground">Transações</p>
            </div>
            <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
              <Calendar className="h-4 w-4 mx-auto mb-1 text-orange-600" />
              <p className="text-lg font-bold text-orange-600">{daysMember}</p>
              <p className="text-[10px] text-muted-foreground">Dias membro</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Controles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Controles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle Ativo */}
          <div className="flex items-center justify-between">
            <Label htmlFor="active" className="text-sm">
              Conta ativa
            </Label>
            <Switch
              id="active"
              checked={user?.isActive !== false}
              onCheckedChange={(checked) => onUpdate({ isActive: checked })}
              disabled={saving}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-sm">Status</Label>
            <Select
              value={subscriptionStatus}
              onValueChange={(value) =>
                onUpdate({ subscriptionStatus: value })
              }
              disabled={saving}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="ACTIVE">Ativo</SelectItem>
                <SelectItem value="INACTIVE">Inativo</SelectItem>
                <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                <SelectItem value="CANCELED">Cancelado</SelectItem>
                <SelectItem value="EXPIRED">Expirado</SelectItem>
                <SelectItem value="GUEST">Convidado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Plano */}
          <div className="space-y-1.5">
            <Label className="text-sm">Plano</Label>
            <Select
              value={(assinante.planId as string) || 'none'}
              onValueChange={(value) =>
                onUpdate({ planId: value === 'none' ? null : value })
              }
              disabled={saving}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sem plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem plano</SelectItem>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} - R$ {Number(p.price).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cidade */}
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Cidade
            </Label>
            <Select
              value={(assinante.cityId as string) || 'none'}
              onValueChange={(value) =>
                onUpdate({ cityId: value === 'none' ? null : value })
              }
              disabled={saving}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Não definida" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não definida</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name} - {city.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Card Resumo Financeiro */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total gasto</span>
            <span className="font-medium">
              R$ {(stats?.totalSpent || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cashback recebido</span>
            <span className="font-medium text-green-600">
              R$ {(stats?.totalCashback || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Descontos usados</span>
            <span className="font-medium text-blue-600">
              R$ {(stats?.totalDiscounts || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pontos usados</span>
            <span className="font-medium text-purple-600">
              {(stats?.totalPointsUsed || 0).toFixed(0)}
            </span>
          </div>
          {plan && (
            <>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mensalidade</span>
                <span className="font-medium">
                  R$ {Number(plan.price || 0).toFixed(2)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
