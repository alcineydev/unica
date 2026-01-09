'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { PushPermissionBanner } from './push-permission-banner'

export function PushProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)

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

  // Nao renderizar banner ate montar no cliente
  if (!mounted) {
    return <>{children}</>
  }

  // Mostrar modal para TODOS os usuarios autenticados (incluindo ADMIN e DEVELOPER)
  const shouldShowBanner =
    status === 'authenticated' &&
    session?.user?.role &&
    ['ASSINANTE', 'PARCEIRO', 'ADMIN', 'DEVELOPER'].includes(session.user.role as string)

  console.log('[PushProvider] status:', status, 'role:', session?.user?.role, 'shouldShow:', shouldShowBanner)

  return (
    <>
      {children}
      {shouldShowBanner && <PushPermissionBanner variant="modal" />}
    </>
  )
}
