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

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator &&
                        'PushManager' in window &&
                        'Notification' in window

      setIsSupported(supported)

      if (supported) {
        setPermission(Notification.permission)

        // Verificar se já está inscrito
        try {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.getSubscription()
          setIsSubscribed(!!subscription)
        } catch (e) {
          console.error('Erro ao verificar subscription:', e)
        }
      }

      setIsLoading(false)
    }

    checkSupport()
  }, [])

  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return null

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registrado:', registration)
      return registration
    } catch (error) {
      console.error('Erro ao registrar SW:', error)
      return null
    }
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !VAPID_PUBLIC_KEY) {
      console.error('Push não suportado ou VAPID key ausente')
      return false
    }

    setIsLoading(true)

    try {
      // Pedir permissão
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        console.log('Permissão negada')
        setIsLoading(false)
        return false
      }

      // Registrar Service Worker
      const registration = await registerServiceWorker()
      if (!registration) {
        setIsLoading(false)
        return false
      }

      await navigator.serviceWorker.ready

      // Criar subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      // Enviar para o servidor
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
          },
          deviceInfo: navigator.userAgent
        })
      })

      if (response.ok) {
        setIsSubscribed(true)
        setIsLoading(false)
        return true
      }

      setIsLoading(false)
      return false
    } catch (error) {
      console.error('Erro ao inscrever:', error)
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
        // Remover do servidor
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        })

        // Cancelar no navegador
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Erro ao desinscrever:', error)
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
