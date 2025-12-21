'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, BellOff, BellRing, Loader2, AlertTriangle } from 'lucide-react'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PushNotificationToggleProps {
  variant?: 'button' | 'card'
  className?: string
}

export function PushNotificationToggle({ variant = 'button', className }: PushNotificationToggleProps) {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe
  } = usePushNotifications()

  // Nao suportado
  if (!isSupported) {
    if (variant === 'card') {
      return (
        <Card className={cn('border-yellow-500/20', className)}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Notificacoes Push
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Seu navegador nao suporta notificacoes push.
              Tente usar Chrome, Firefox, Edge ou Safari.
            </p>
          </CardContent>
        </Card>
      )
    }
    return null
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe()
      if (success) {
        toast.success('Notificacoes desativadas')
        localStorage.removeItem('push-subscribed')
      } else {
        toast.error('Erro ao desativar notificacoes')
      }
    } else {
      const success = await subscribe()
      if (success) {
        toast.success('Notificacoes ativadas!')
        localStorage.setItem('push-subscribed', 'true')
      } else {
        if (permission === 'denied') {
          toast.error('Notificacoes bloqueadas', {
            description: 'Voce precisa permitir nas configuracoes do navegador.'
          })
        } else {
          toast.error('Erro ao ativar notificacoes')
        }
      }
    }
  }

  // Variante card
  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {isSubscribed ? (
              <BellRing className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            Notificacoes Push
          </CardTitle>
          <CardDescription>
            {isSubscribed
              ? 'Voce esta recebendo notificacoes'
              : 'Ative para receber promocoes e novidades'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permission === 'denied' ? (
            <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500">
              <AlertTriangle className="h-4 w-4" />
              <span>Bloqueado nas configuracoes do navegador</span>
            </div>
          ) : (
            <Button
              variant={isSubscribed ? 'outline' : 'default'}
              onClick={handleToggle}
              disabled={isLoading}
              className="w-full gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSubscribed ? (
                <BellOff className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              {isSubscribed ? 'Desativar' : 'Ativar Notificacoes'}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Variante button (padrao)
  if (permission === 'denied') {
    return (
      <Button variant="outline" disabled className={cn('gap-2', className)}>
        <BellOff className="h-4 w-4" />
        Bloqueado
      </Button>
    )
  }

  return (
    <Button
      variant={isSubscribed ? 'default' : 'outline'}
      onClick={handleToggle}
      disabled={isLoading}
      className={cn('gap-2', className)}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <BellRing className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      {isSubscribed ? 'Notificacoes Ativas' : 'Ativar Notificacoes'}
    </Button>
  )
}
