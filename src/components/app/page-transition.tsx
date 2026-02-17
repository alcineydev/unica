'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

const MIN_DISPLAY_MS = 300 // Mínimo 300ms (era 1s)

export function PageTransition() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const prevPathname = useRef(pathname)
  const showTimeRef = useRef<number>(0)
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const minTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingHide = useRef(false)

  // Limpar todos os timeouts
  const clearAllTimeouts = useCallback(() => {
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
    if (minTimeoutRef.current) clearTimeout(minTimeoutRef.current)
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
  }, [])

  // Esconder com fade-out
  const hideWithFade = useCallback(() => {
    const elapsed = Date.now() - showTimeRef.current
    const remaining = MIN_DISPLAY_MS - elapsed

    if (remaining > 0) {
      // Ainda não completou o mínimo — aguardar
      pendingHide.current = true
      minTimeoutRef.current = setTimeout(() => {
        setIsFadingOut(true)
        fadeTimeoutRef.current = setTimeout(() => {
          setIsVisible(false)
          setIsFadingOut(false)
          pendingHide.current = false
        }, 200) // Duração do fade-out
      }, remaining)
    } else {
      // Já passou o mínimo — esconder agora
      setIsFadingOut(true)
      fadeTimeoutRef.current = setTimeout(() => {
        setIsVisible(false)
        setIsFadingOut(false)
        pendingHide.current = false
      }, 200)
    }
  }, [])

  // Detectar quando navegação completou
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname
      if (isVisible) {
        hideWithFade()
      }
    }
  }, [pathname, isVisible, hideWithFade])

  // Interceptar cliques em links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // Pular interceptação se for BottomNav (navegação instantânea)
      const isBottomNav = (e.target as HTMLElement).closest('[data-bottom-nav]')
      if (isBottomNav) return

      if (
        href.startsWith('http') ||
        href.startsWith('#') ||
        href === pathname ||
        anchor.hasAttribute('target')
      ) return

      if (href.startsWith('/app')) {
        clearAllTimeouts()
        pendingHide.current = false
        setIsFadingOut(false)
        setIsVisible(true)
        showTimeRef.current = Date.now()

        // Safety: esconder após 6s caso algo trave
        safetyTimeoutRef.current = setTimeout(() => {
          hideWithFade()
        }, 6000)
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      clearAllTimeouts()
    }
  }, [pathname, clearAllTimeouts, hideWithFade])

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[9990] flex items-center justify-center bg-[#f8fafc] transition-opacity duration-200 ${isFadingOut ? 'opacity-0' : 'opacity-100'
        }`}
    >
      <div className="flex flex-col items-center gap-5">
        {/* Logo com spinner */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Spinner track (fundo) */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="2.5"
            />
          </svg>

          {/* Spinner ativo */}
          <svg className="absolute inset-0 w-full h-full unica-spinner" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke="url(#unica-spinner-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="60 170"
            />
            <defs>
              <linearGradient id="unica-spinner-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
          </svg>

          {/* Logo central */}
          <div className="relative w-12 h-12 bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#3b82f6] rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <span className="text-white font-bold text-xl">U</span>
          </div>
        </div>

        {/* Barra de progresso fake */}
        <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full unica-progress" />
        </div>
      </div>
    </div>
  )
}
