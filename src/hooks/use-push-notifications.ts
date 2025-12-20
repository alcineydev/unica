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
      const supported = typeof window !== 'undefined' &&
                        'serviceWorker' in navigator &&
                        'PushManager' in window &&
                        'Notification' in window

      setIsSupported(supported)

      if (supported) {
        setPermission(Notification.permission)

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
      console.error('Push nao suportado ou VAPID key ausente')
      return false
    }

    setIsLoading(true)

    try {
      // Pedir permissao
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        console.log('Permissao negada')
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

      // Converter VAPID key
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)

      // Criar subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      })

      // Extrair keys
      const p256dhKey = subscription.getKey('p256dh')
      const authKey = subscription.getKey('auth')

      if (!p256dhKey || !authKey) {
        console.error('Nao foi possivel obter as chaves da subscription')
        setIsLoading(false)
        return false
      }

      // Enviar para o servidor
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
