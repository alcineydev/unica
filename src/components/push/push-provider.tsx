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

export function PushProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)

  // Sincronizar subscription existente com o usuário atual
  const syncExistingSubscription = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        console.log('[PushProvider] Subscription existente encontrada, sincronizando com usuário atual...')

        const p256dhKey = subscription.getKey('p256dh')
        const authKey = subscription.getKey('auth')

        if (p256dhKey && authKey) {
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

          if (response.ok) {
            console.log('[PushProvider] Subscription sincronizada com sucesso!')
          } else {
            console.error('[PushProvider] Erro ao sincronizar subscription:', await response.text())
          }
        }
      }
    } catch (error) {
      console.error('[PushProvider] Erro ao sincronizar subscription:', error)
    }
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
    if (status === 'authenticated' && session?.user?.id) {
      console.log('[PushProvider] Usuário autenticado, verificando subscription existente...')
      syncExistingSubscription()
    }
  }, [status, session?.user?.id, syncExistingSubscription])

  // Nao renderizar banner ate montar no cliente
  if (!mounted) {
    return <>{children}</>
  }

  // Mostrar banner apenas para usuarios autenticados com role elegivel
  const shouldShowBanner =
    status === 'authenticated' &&
    session?.user?.role &&
    ['ASSINANTE', 'PARCEIRO', 'ADMIN', 'DEVELOPER'].includes(session.user.role as string)

  console.log('[PushProvider] status:', status, 'role:', session?.user?.role, 'shouldShow:', shouldShowBanner)

  return (
    <>
      {children}
      {shouldShowBanner && <PushPermissionBanner variant="banner" />}
    </>
  )
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
