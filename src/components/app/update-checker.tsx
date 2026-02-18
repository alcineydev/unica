'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'

// Mesma versão que src/lib/version.ts
const CURRENT_VERSION = '1.0.11'
const CHECK_INTERVAL = 60000 // 60 segundos

export function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [newVersion, setNewVersion] = useState('')
  const [updating, setUpdating] = useState(false)

  const checkVersion = useCallback(async () => {
    try {
      const res = await fetch(`/api/version?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })

      if (!res.ok) return

      const data = await res.json()

      if (data.version && data.version !== CURRENT_VERSION) {
        setNewVersion(data.version)
        setUpdateAvailable(true)
      }
    } catch {
      // Silencioso — sem conexão não bloqueia
    }
  }, [])

  useEffect(() => {
    // Primeira checagem após 10 segundos (não travar o carregamento)
    const initialTimeout = setTimeout(checkVersion, 10000)

    // Checagem periódica
    const interval = setInterval(checkVersion, CHECK_INTERVAL)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [checkVersion])

  const handleUpdate = () => {
    setUpdating(true)

    // Limpar caches do service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister()
        })
      })
    }

    // Limpar caches do browser
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name)
        })
      })
    }

    // Reload forçado após limpar caches
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  if (!updateAvailable) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Ícone */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-blue-600" />
        </div>

        {/* Título */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Nova Versão Disponível
        </h2>

        {/* Descrição */}
        <p className="text-sm text-gray-500 mb-1">
          Uma nova versão do UNICA está disponível.
        </p>
        <p className="text-xs text-gray-400 mb-6">
          v{CURRENT_VERSION} → v{newVersion}
        </p>

        {/* Botão — SEM opção de fechar */}
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-200/40 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {updating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Atualizar Agora
            </>
          )}
        </button>

        {/* Info */}
        <p className="text-[10px] text-gray-300 mt-3">
          A atualização leva apenas alguns segundos
        </p>
      </div>
    </div>
  )
}
