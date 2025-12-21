'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { PushPermissionBanner } from './push-permission-banner'

export function PushProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  useEffect(() => {
    // Registrar Service Worker ao carregar (se ainda nao estiver registrado)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration('/sw.js').then((registration) => {
        if (!registration) {
          navigator.serviceWorker
            .register('/sw.js')
            .then((reg) => {
              console.log('[Push] Service Worker registrado:', reg.scope)
            })
            .catch((error) => {
              console.error('[Push] Erro ao registrar SW:', error)
            })
        }
      })
    }
  }, [])

  // So mostrar banner para usuarios logados (Assinantes e Parceiros)
  const shouldShowBanner = session?.user &&
    ['ASSINANTE', 'PARCEIRO'].includes(session.user.role as string)

  return (
    <>
      {children}
      {shouldShowBanner && <PushPermissionBanner variant="banner" />}
    </>
  )
}
