'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Gift, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PushPermissionBannerProps {
  className?: string
  variant?: 'banner' | 'modal' | 'compact'
}

export function PushPermissionBanner({ className, variant = 'banner' }: PushPermissionBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const { isSupported, isSubscribed, isLoading, permission, subscribe } = usePushNotifications()

  useEffect(() => {
    // Verificar se deve mostrar o banner
    const shouldShow = checkShouldShowBanner()

    if (shouldShow && isSupported && !isSubscribed && permission !== 'denied' && !isLoading) {
      // Delay para nao aparecer imediatamente ao carregar
      const timer = setTimeout(() => {
        setIsAnimating(true)
        setTimeout(() => setIsVisible(true), 100)
      }, 3000) // Aparece apos 3 segundos

      return () => clearTimeout(timer)
    }
  }, [isSupported, isSubscribed, permission, isLoading])

  const checkShouldShowBanner = (): boolean => {
    if (typeof window === 'undefined') return false

    // Verificar se ja ativou
    const alreadySubscribed = localStorage.getItem('push-subscribed')
    if (alreadySubscribed === 'true') return false

    // Verificar se recusou recentemente
    const dismissedAt = localStorage.getItem('push-dismissed-at')
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt)
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)

      // Se recusou ha menos de 3 dias, nao mostrar
      if (daysSinceDismissed < 3) return false
    }

    return true
  }

  const handleEnable = async () => {
    const success = await subscribe()

    if (success) {
      toast.success('Notificacoes ativadas!', {
        description: 'Voce recebera avisos de promocoes e novidades.'
      })
      localStorage.setItem('push-subscribed', 'true')
      localStorage.removeItem('push-dismissed-at')
      handleClose()
    } else {
      if (permission === 'denied') {
        toast.error('Notificacoes bloqueadas', {
          description: 'Voce precisa permitir nas configuracoes do navegador.'
        })
      } else {
        toast.error('Erro ao ativar notificacoes', {
          description: 'Tente novamente mais tarde.'
        })
      }
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('push-dismissed-at', new Date().toISOString())
    handleClose()
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => setIsAnimating(false), 300)
  }

  // Nao renderizar se nao deve mostrar
  if (!isAnimating) return null

  // Variante compacta (para header/sidebar)
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'transition-all duration-300',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
          className
        )}
      >
        <Button
          onClick={handleEnable}
          disabled={isLoading}
          size="sm"
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          <Bell className="h-4 w-4" />
          Ativar Notificacoes
        </Button>
      </div>
    )
  }

  // Variante modal (centralizado)
  if (variant === 'modal') {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300',
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={handleDismiss}
      >
        <Card
          className={cn(
            'w-full max-w-md transition-all duration-300 transform',
            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <CardContent className="p-6">
            <div className="flex justify-end mb-2">
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h3 className="text-xl font-bold mb-2">Ative as Notificacoes</h3>
              <p className="text-muted-foreground">
                Receba avisos de promocoes exclusivas, novos beneficios e atualizacoes importantes diretamente no seu dispositivo.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <Gift className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Promocoes exclusivas em primeira mao</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <span>Novos parceiros e beneficios</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Bell className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span>Lembretes importantes da sua assinatura</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDismiss}
              >
                Agora nao
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleEnable}
                disabled={isLoading}
              >
                <Bell className="h-4 w-4" />
                {isLoading ? 'Ativando...' : 'Ativar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Variante banner (padrao - fixo no bottom)
  return (
    <div
      className={cn(
        'fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:max-w-md z-50 transition-all duration-500',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
        className
      )}
    >
      <Card className="border-primary/20 shadow-lg bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                <Bell className="h-6 w-6 text-primary" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-sm">Ative as Notificacoes</h4>
                <button
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-foreground transition-colors -mt-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                Receba promocoes exclusivas e novidades dos parceiros.
              </p>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={handleDismiss}
                >
                  Depois
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={handleEnable}
                  disabled={isLoading}
                >
                  <Bell className="h-3.5 w-3.5" />
                  {isLoading ? 'Ativando...' : 'Ativar Agora'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
