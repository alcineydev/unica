'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, X } from 'lucide-react'
import { usePushNotifications } from '@/hooks/use-push-notifications'

export function PushNotificationPrompt() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const { isSupported, isSubscribed, permission, isLoading, subscribe } = usePushNotifications()

  useEffect(() => {
    // Verificar se ja foi dispensado
    const wasDismissed = localStorage.getItem('push-prompt-dismissed')
    if (wasDismissed) {
      setDismissed(true)
      return
    }

    // Mostrar apos 5 segundos se nao esta inscrito e nao foi negado
    const timer = setTimeout(() => {
      if (isSupported && !isSubscribed && permission !== 'denied' && !isLoading) {
        setShow(true)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [isSupported, isSubscribed, permission, isLoading])

  const handleEnable = async () => {
    const success = await subscribe()
    if (success) {
      setShow(false)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    localStorage.setItem('push-prompt-dismissed', 'true')
  }

  if (!show || dismissed || isSubscribed || permission === 'denied') {
    return null
  }

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 z-50 animate-in slide-in-from-bottom-4">
      <Card className="shadow-lg border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">Ativar notificacoes</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Receba alertas de promocoes, novidades e atualizacoes importantes
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleEnable} disabled={isLoading}>
                  Ativar
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  Agora nao
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
