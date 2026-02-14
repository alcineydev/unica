'use client'

import { useState, useEffect } from 'react'
import { Bell, Gift, Tag, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const STORAGE_KEY = 'unica_notification_permission'
const MAX_DISMISSALS = 3

interface PermissionState {
  granted: boolean
  dismissCount: number
  lastDismissed: string | null
}

export function NotificationPermissionModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    checkAndShowModal()
  }, [])

  const checkAndShowModal = async () => {
    // Verificar se o navegador suporta notificações
    if (typeof window === 'undefined') return

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('[NotificationModal] Navegador não suporta notificações')
      return
    }

    // Se já tem permissão, não mostrar
    if (Notification.permission === 'granted') {
      return
    }

    // Se já negou permanentemente no navegador, não mostrar
    if (Notification.permission === 'denied') {
      return
    }

    // Verificar estado salvo
    const savedState = localStorage.getItem(STORAGE_KEY)
    if (savedState) {
      try {
        const state: PermissionState = JSON.parse(savedState)

        // Se já aceitou ou recusou muitas vezes, não mostrar
        if (state.granted || state.dismissCount >= MAX_DISMISSALS) {
          return
        }

        // Se recusou recentemente (menos de 24h), não mostrar
        if (state.lastDismissed) {
          const lastDismissed = new Date(state.lastDismissed)
          const hoursSince = (Date.now() - lastDismissed.getTime()) / (1000 * 60 * 60)
          if (hoursSince < 24) {
            return
          }
        }
      } catch {
        // Se erro ao parsear, continuar
      }
    }

    // Delay maior para não conflitar com notification modal
    setTimeout(() => {
      // Só abrir se não houver outro dialog aberto
      const hasOpenDialog = document.querySelector('[data-state="open"][role="dialog"]')
      if (!hasOpenDialog) {
        setIsOpen(true)
      }
    }, 5000)
  }

  const handleRequestPermission = async () => {
    setIsRequesting(true)

    try {
      const permission = await Notification.requestPermission()

      if (permission === 'granted') {
        // Salvar que aceitou
        const state: PermissionState = {
          granted: true,
          dismissCount: 0,
          lastDismissed: null
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

        // Registrar para push notifications
        await registerPushSubscription()

        setIsOpen(false)
      } else {
        // Usuário negou no popup do navegador
        handleDismiss()
      }
    } catch (error) {
      console.error('[NotificationModal] Erro ao solicitar permissão:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  const handleDismiss = () => {
    const savedState = localStorage.getItem(STORAGE_KEY)
    let currentState: PermissionState = { granted: false, dismissCount: 0, lastDismissed: null }

    if (savedState) {
      try {
        currentState = JSON.parse(savedState)
      } catch {
        // Usar estado padrão
      }
    }

    const newState: PermissionState = {
      granted: false,
      dismissCount: currentState.dismissCount + 1,
      lastDismissed: new Date().toISOString()
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
    setIsOpen(false)
  }

  const registerPushSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready

      // Buscar VAPID key
      const response = await fetch('/api/push/subscribe')
      const { publicKey } = await response.json()

      if (!publicKey) {
        console.error('[NotificationModal] VAPID key não encontrada')
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      })

      // Extrair dados da subscription
      const subscriptionJson = subscription.toJSON()

      // Enviar subscription para o servidor
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscriptionJson.endpoint,
          keys: subscriptionJson.keys,
          deviceInfo: navigator.userAgent.substring(0, 100),
          userAgent: navigator.userAgent,
          platform: navigator.platform
        })
      })

      console.log('[NotificationModal] Push subscription registrada com sucesso')
    } catch (error) {
      console.error('[NotificationModal] Erro ao registrar push subscription:', error)
    }
  }

  // Não renderizar se não estiver aberto
  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">Ative as Notificações</DialogTitle>
          <DialogDescription className="text-base">
            Receba alertas importantes diretamente no seu celular!
          </DialogDescription>
        </DialogHeader>

        {/* Benefícios */}
        <div className="space-y-3 my-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Tag className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-green-800">Promoções Exclusivas</p>
              <p className="text-sm text-green-600">Seja o primeiro a saber dos descontos</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-blue-800">Novos Benefícios</p>
              <p className="text-sm text-blue-600">Saiba quando novos parceiros entrarem</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-purple-800">Lembretes</p>
              <p className="text-sm text-purple-600">Vencimento do plano e cashback</p>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="space-y-2">
          <Button
            className="w-full h-12 text-base"
            onClick={handleRequestPermission}
            disabled={isRequesting}
          >
            {isRequesting ? (
              'Solicitando...'
            ) : (
              <>
                <Bell className="h-5 w-5 mr-2" />
                Ativar Notificações
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleDismiss}
          >
            Agora não
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Você pode alterar isso nas configurações a qualquer momento
        </p>
      </DialogContent>
    </Dialog>
  )
}
