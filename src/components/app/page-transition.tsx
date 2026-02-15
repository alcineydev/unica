'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function PageTransition() {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const prevPathname = useRef(pathname)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Se pathname mudou, a navegação completou → esconder transição
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname

      // Pequeno delay para suavizar a entrada
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setIsTransitioning(false)
      }, 150)
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [pathname])

  // Interceptar cliques em links para mostrar transição
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')

      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // Ignorar links externos, âncoras e mesma página
      if (
        href.startsWith('http') ||
        href.startsWith('#') ||
        href === pathname ||
        anchor.hasAttribute('target')
      ) return

      // Só para rotas /app
      if (href.startsWith('/app')) {
        setIsTransitioning(true)
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [pathname])

  if (!isTransitioning) return null

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center pointer-events-none">
      {/* Overlay sutil */}
      <div className="absolute inset-0 bg-[#f8fafc]/80 backdrop-blur-[2px] animate-in fade-in duration-200" />

      {/* Spinner premium */}
      <div className="relative animate-in fade-in zoom-in-95 duration-300">
        {/* Anel externo */}
        <div className="w-12 h-12 rounded-full border-[3px] border-gray-200/60" />
        {/* Anel spinner */}
        <div className="absolute inset-0 w-12 h-12 rounded-full border-[3px] border-transparent border-t-blue-600 animate-spin" />
        {/* Ponto central */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
