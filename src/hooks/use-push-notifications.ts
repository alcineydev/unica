'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

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
  const vapidKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const checkSupport = async () => {
      // Verificar suporte basico
      const supported = typeof window !== 'undefined' &&
                        'serviceWorker' in navigator &&
                        'PushManager' in window &&
                        'Notification' in window

      console.log('[PUSH] Suporte verificado:', supported)
      setIsSupported(supported)

      if (!supported) {
        setIsLoading(false)
        return
      }

      // Obter permissao atual
      setPermission(Notification.permission)
      console.log('[PUSH] Permissao atual:', Notification.permission)

      // Verificar subscription existente (com timeout para nao travar)
      try {
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('SW timeout')), 3000)
          )
        ])

        if (registration) {
          const subscription = await (registration as ServiceWorkerRegistration).pushManager.getSubscription()
          setIsSubscribed(!!subscription)
          console.log('[PUSH] Ja inscrito:', !!subscription)
        }
      } catch (e) {
        console.log('[PUSH] SW nao pronto ainda, continuando...')
      }

      setIsLoading(false)
      console.log('[PUSH] Hook pronto')
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
    if (!isSupported) {
      console.error('[PUSH] Push nao suportado')
      return false
    }

    setIsLoading(true)

    try {
      // Pedir permissao
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        setIsLoading(false)
        return false
      }

      // Buscar VAPID public key do servidor
      if (!vapidKeyRef.current) {
        console.log('[PUSH] Buscando VAPID key do servidor...')
        const keyResponse = await fetch('/api/push/subscribe')
        const keyData = await keyResponse.json()

        console.log('[PUSH] Resposta da API:', keyData)

        if (!keyResponse.ok || !keyData.publicKey) {
          console.error('[PUSH] Erro ao buscar VAPID key:', keyData)
          setIsLoading(false)
          return false
        }

        vapidKeyRef.current = keyData.publicKey
        console.log('[PUSH] VAPID key recebida:', keyData.publicKey?.substring(0, 20) + '...')
      }

      // Registrar Service Worker
      const registration = await registerServiceWorker()
      if (!registration) {
        setIsLoading(false)
        return false
      }

      await navigator.serviceWorker.ready

      // Verificar se VAPID key está disponível
      if (!vapidKeyRef.current) {
        console.error('[PUSH] VAPID key nao disponivel')
        setIsLoading(false)
        return false
      }

      // Converter VAPID key
      const applicationServerKey = urlBase64ToUint8Array(vapidKeyRef.current)

      // Criar subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      })

      // Extrair keys
      const p256dhKey = subscription.getKey('p256dh')
      const authKey = subscription.getKey('auth')

      if (!p256dhKey || !authKey) {
        console.error('[PUSH] Nao foi possivel obter as chaves')
        setIsLoading(false)
        return false
      }

      // Detectar plataforma
      const detectPlatform = (): string => {
        const ua = navigator.userAgent.toLowerCase()
        if (/iphone|ipad|ipod/.test(ua)) return 'ios'
        if (/android/.test(ua)) return 'android'
        if (/windows/.test(ua)) return 'windows'
        if (/mac/.test(ua)) return 'macos'
        if (/linux/.test(ua)) return 'linux'
        return 'unknown'
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
          userAgent: navigator.userAgent,
          platform: detectPlatform(),
          deviceInfo: `${detectPlatform()} - ${navigator.userAgent.substring(0, 100)}`
        })
      })

      console.log('[PUSH] Resposta do POST:', response.status)

      if (response.ok) {
        setIsSubscribed(true)
        setIsLoading(false)
        console.log('[PUSH] Inscricao concluida com sucesso!')
        return true
      }

      // Log do erro
      const errorData = await response.json().catch(() => ({}))
      console.error('[PUSH] Erro ao salvar no servidor:', errorData)

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
