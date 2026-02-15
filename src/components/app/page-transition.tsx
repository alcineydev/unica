'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function PageTransition() {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const prevPathname = useRef(pathname)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname
      // Pathname mudou = navegação completou, esconder com fade
      hideTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false)
      }, 100)
    }

    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [pathname])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      if (
        href.startsWith('http') ||
        href.startsWith('#') ||
        href === pathname ||
        anchor.hasAttribute('target')
      ) return

      if (href.startsWith('/app')) {
        // Cancelar timeout anterior
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)

        // Mostrar IMEDIATAMENTE
        setIsNavigating(true)

        // Safety: esconder após 5s caso algo trave
        timeoutRef.current = setTimeout(() => {
          setIsNavigating(false)
        }, 5000)
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [pathname])

  if (!isNavigating) return null

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-[#f8fafc] animate-in fade-in duration-150">
      {/* Logo animada */}
      <div className="flex flex-col items-center gap-4">
        {/* Logo UNICA */}
        <div className="relative">
          {/* Anel externo pulsante */}
          <div className="absolute -inset-3 rounded-full border-2 border-blue-200 animate-ping opacity-20" />

          {/* Container logo */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 animate-in zoom-in-50 duration-300">
            <span className="text-white font-bold text-2xl tracking-tight">U</span>
          </div>

          {/* Spinner orbital */}
          <svg className="absolute -inset-2 w-20 h-20 animate-spin spinner-orbital" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke="url(#spinner-gradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="80 200"
            />
            <defs>
              <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="1" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Texto */}
        <div className="flex flex-col items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
          <span className="text-sm font-medium text-gray-500">Carregando</span>
          {/* Dots animados */}
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce bounce-delay-0" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce bounce-delay-150" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce bounce-delay-300" />
          </div>
        </div>
      </div>
    </div>
  )
}
