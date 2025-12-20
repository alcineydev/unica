'use client'

import { useState, useEffect, useCallback } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSupport = async () => {
      console.log('[PUSH] Verificando suporte...')
      console.log('[PUSH] VAPID_PUBLIC_KEY:', VAPID_PUBLIC_KEY ? 'presente' : 'AUSENTE')

      const supported = typeof window !== 'undefined' &&
                        'serviceWorker' in navigator &&
                        'PushManager' in window &&
                        'Notification' in window

      console.log('[PUSH] Suportado:', supported)
      setIsSupported(supported)

      if (supported) {
        setPermission(Notification.permission)
        console.log('[PUSH] Permissao atual:', Notification.permission)

        try {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.getSubscription()
          setIsSubscribed(!!subscription)
          console.log('[PUSH] Ja inscrito:', !!subscription)
        } catch (e) {
          console.error('[PUSH] Erro ao verificar subscription:', e)
        }
      }

      setIsLoading(false)
    }

    checkSupport()
  }, [])

  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      console.error('[PUSH] Service Worker nao suportado')
      return null
    }

    try {
      console.log('[PUSH] Registrando Service Worker...')
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('[PUSH] Service Worker registrado:', registration)
      return registration
    } catch (error) {
      console.error('[PUSH] Erro ao registrar SW:', error)
      return null
    }
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    console.log('[PUSH] Iniciando subscribe...')
    console.log('[PUSH] isSupported:', isSupported)
    console.log('[PUSH] VAPID_PUBLIC_KEY:', VAPID_PUBLIC_KEY)

    if (!isSupported) {
      console.error('[PUSH] Push nao suportado')
      return false
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error('[PUSH] VAPID_PUBLIC_KEY ausente!')
      return false
    }

    setIsLoading(true)

    try {
      // Pedir permissao
      console.log('[PUSH] Pedindo permissao...')
      const permissionResult = await Notification.requestPermission()
      console.log('[PUSH] Permissao:', permissionResult)
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        console.log('[PUSH] Permissao negada')
        setIsLoading(false)
        return false
      }

      // Registrar Service Worker
      console.log('[PUSH] Registrando SW...')
      const registration = await registerServiceWorker()
      if (!registration) {
        console.error('[PUSH] Falha ao registrar SW')
        setIsLoading(false)
        return false
      }

      console.log('[PUSH] Aguardando SW ficar pronto...')
      await navigator.serviceWorker.ready
      console.log('[PUSH] SW pronto!')

      // Converter VAPID key
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      console.log('[PUSH] VAPID key convertida')

      // Criar subscription
      console.log('[PUSH] Criando subscription...')
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      })
      console.log('[PUSH] Subscription criada:', subscription.endpoint)

      // Extrair keys
      const p256dhKey = subscription.getKey('p256dh')
      const authKey = subscription.getKey('auth')

      if (!p256dhKey || !authKey) {
        console.error('[PUSH] Nao foi possivel obter as chaves')
        setIsLoading(false)
        return false
      }

      // Enviar para o servidor
      console.log('[PUSH] Enviando para servidor...')
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(p256dhKey),
            auth: arrayBufferToBase64(authKey)
          },
          deviceInfo: navigator.userAgent
        })
      })

      console.log('[PUSH] Resposta do servidor:', response.status)

      if (response.ok) {
        console.log('[PUSH] Inscrito com sucesso!')
        setIsSubscribed(true)
        setIsLoading(false)
        return true
      } else {
        const errorData = await response.json()
        console.error('[PUSH] Erro do servidor:', errorData)
      }

      setIsLoading(false)
      return false
    } catch (error) {
      console.error('[PUSH] Erro ao inscrever:', error)
      setIsLoading(false)
      return false
    }
  }, [isSupported, registerServiceWorker])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        })

        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('[PUSH] Erro ao desinscrever:', error)
      setIsLoading(false)
      return false
    }
  }, [])

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe
  }
}
