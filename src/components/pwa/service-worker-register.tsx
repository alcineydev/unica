'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registrado:', registration.scope)
          })
          .catch((error) => {
            console.log('Erro ao registrar SW:', error)
          })
      })
    }
  }, [])

  return null
}

