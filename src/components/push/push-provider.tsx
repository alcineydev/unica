'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { PushPermissionBanner } from './push-permission-banner'

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

function detectPlatform(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  if (/windows/.test(ua)) return 'windows'
  if (/mac/.test(ua)) return 'macos'
  if (/linux/.test(ua)) return 'linux'
  return 'unknown'
}

export function PushProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [syncAttempted, setSyncAttempted] = useState(false)

  // Sincronizar subscription existente com o usuário atual
  const syncExistingSubscription = useCallback(async (userId: string) => {
    console.log('[PushProvider] === INICIANDO SINCRONIZAÇÃO ===')
    console.log('[PushProvider] UserId atual:', userId)

    if (typeof window === 'undefined') {
      console.log('[PushProvider] ❌ Sync abortado: window undefined')
      return
    }

    if (!('serviceWorker' in navigator)) {
      console.log('[PushProvider] ❌ Sync abortado: serviceWorker não suportado')
      return
    }

    if (!('PushManager' in window)) {
      console.log('[PushProvider] ❌ Sync abortado: PushManager não suportado')
      return
    }

    try {
      console.log('[PushProvider] Aguardando Service Worker ficar pronto...')
      const registration = await navigator.serviceWorker.ready
      console.log('[PushProvider] ✅ Service Worker pronto:', registration.scope)

      const subscription = await registration.pushManager.getSubscription()
      console.log('[PushProvider] Subscription existente no browser:', !!subscription)

      if (subscription) {
        console.log('[PushProvider] Endpoint:', subscription.endpoint.substring(0, 60) + '...')

        const p256dhKey = subscription.getKey('p256dh')
        const authKey = subscription.getKey('auth')

        console.log('[PushProvider] Chaves disponíveis - p256dh:', !!p256dhKey, 'auth:', !!authKey)

        if (p256dhKey && authKey) {
          const payload = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(p256dhKey),
              auth: arrayBufferToBase64(authKey)
            },
            userAgent: navigator.userAgent,
            platform: detectPlatform(),
            deviceInfo: `${detectPlatform()} - ${navigator.userAgent.substring(0, 100)}`
          }

          console.log('[PushProvider] Enviando para /api/push/subscribe...')
          console.log('[PushProvider] Platform:', payload.platform)

          const response = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })

          const data = await response.json()

          if (response.ok) {
            console.log('[PushProvider] ✅ Subscription sincronizada com sucesso!', data)
          } else {
            console.error('[PushProvider] ❌ Erro na resposta:', response.status, data)
          }
        } else {
          console.log('[PushProvider] ❌ Chaves não disponíveis, não é possível sincronizar')
        }
      } else {
        console.log('[PushProvider] ℹ️ Nenhuma subscription para sincronizar (usuário nunca ativou push neste browser)')
      }
    } catch (error) {
      console.error('[PushProvider] ❌ Erro ao sincronizar subscription:', error)
    }

    console.log('[PushProvider] === FIM DA SINCRONIZAÇÃO ===')
  }, [])

  useEffect(() => {
    setMounted(true)

    // Registrar Service Worker ao carregar
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PushProvider] SW registrado:', reg.scope)
        })
        .catch((error) => {
          console.error('[PushProvider] Erro ao registrar SW:', error)
        })
    }
  }, [])

  // Sincronizar subscription quando usuário autenticar
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !syncAttempted) {
      console.log('[PushProvider] Usuário autenticado:', session.user.email, 'Role:', session.user.role)
      setSyncAttempted(true)
      syncExistingSubscription(session.user.id)
    }
  }, [status, session?.user?.id, session?.user?.email, session?.user?.role, syncAttempted, syncExistingSubscription])

  // Nao renderizar banner ate montar no cliente
  if (!mounted) {
    return <>{children}</>
  }

  // Mostrar banner apenas para usuarios autenticados com role elegivel
  const shouldShowBanner =
    status === 'authenticated' &&
    session?.user?.role &&
    ['ASSINANTE', 'PARCEIRO', 'ADMIN', 'DEVELOPER'].includes(session.user.role as string)

  console.log('[PushProvider] Render - status:', status, 'role:', session?.user?.role, 'shouldShowBanner:', shouldShowBanner)

  return (
    <>
      {children}
      {shouldShowBanner && <PushPermissionBanner variant="banner" />}
    </>
  )
}
