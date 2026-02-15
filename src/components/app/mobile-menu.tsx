'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Menu, X, User, Wallet, Bell, LogOut, ChevronRight
} from 'lucide-react'

const menuItems = [
  { icon: User, label: 'Meu Perfil', href: '/app/perfil' },
  { icon: Wallet, label: 'Carteira', href: '/app/carteira' },
  { icon: Bell, label: 'Notificações', href: '/app/notificacoes' },
]

export function MobileMenu({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Fechar ao navegar
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const isDark = variant === 'dark'

  return (
    <div className="relative lg:hidden" ref={menuRef}>
      {/* Botão hamburguer */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Menu"
        className={`p-2 rounded-full transition-all ${
          isDark
            ? 'text-white/40 hover:text-white/70 hover:bg-white/5'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        }`}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu panel */}
          <div className="fixed right-0 top-0 h-full w-72 bg-[#0a1628] shadow-2xl z-[9999] animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-white/[0.06]">
              <span className="text-sm font-semibold text-white">Menu</span>
              <button
                onClick={() => setIsOpen(false)}
                title="Fechar menu"
                className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <nav className="px-3 py-3 space-y-0.5">
              {menuItems.map(({ icon: Icon, label, href }) => {
                const isActive = pathname === href

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-3 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-blue-500/15 text-blue-400 font-semibold'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="text-sm">{label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-30" />
                  </Link>
                )
              })}
            </nav>

            {/* Sair */}
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-8 pt-3 border-t border-white/[0.06]">
              <button
                onClick={() => {
                  setIsOpen(false)
                  signOut({ callbackUrl: '/login' })
                }}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
