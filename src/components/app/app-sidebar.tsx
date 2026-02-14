'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import {
  Home, Search, CreditCard, Store, Star,
  Bell, User, LogOut, Crown, Sparkles
} from 'lucide-react'

const navItems = [
  { icon: Home, label: 'Início', href: '/app' },
  { icon: Search, label: 'Buscar', href: '/app/buscar' },
  { icon: CreditCard, label: 'Carteira', href: '/app/carteira' },
  { icon: Store, label: 'Parceiros', href: '/app/parceiros' },
  { icon: Star, label: 'Avaliações', href: '/app/minhas-avaliacoes' },
  { icon: Bell, label: 'Notificações', href: '/app/notificacoes' },
  { icon: User, label: 'Meu Perfil', href: '/app/perfil' },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/app/notifications/count')
        if (res.ok) {
          const data = await res.json()
          setNotifCount(data.count || 0)
        }
      } catch { /* silencioso */ }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any
  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuário'
  const displayAvatar = user?.avatar || user?.image || ''
  const firstName = displayName.split(' ')[0]
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 bg-gradient-to-b from-[#0a1628] via-[#0d1b36] to-[#0a1628] overflow-hidden">
      {/* Decoração */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/5 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Logo */}
      <div className="relative px-5 pt-6 pb-4">
        <Link href="/app" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-extrabold text-sm">U</span>
          </div>
          <div>
            <span className="font-bold text-[15px] leading-none tracking-tight text-white">UNICA</span>
            <span className="text-[9px] text-blue-300/40 block leading-tight">Clube de Benefícios</span>
          </div>
        </Link>
      </div>

      {/* Perfil mini */}
      <div className="relative px-4 pb-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/10 shrink-0 flex items-center justify-center">
            {displayAvatar ? (
              <Image src={displayAvatar} alt={firstName} width={40} height={40} className="w-full h-full object-cover" unoptimized />
            ) : (
              <span className="text-white/70 font-semibold text-xs">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{firstName}</p>
            <div className="flex items-center gap-1">
              <Crown className="h-3 w-3 text-amber-400/70" />
              <span className="text-[10px] text-white/30">Assinante</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto relative">
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = href === '/app'
            ? pathname === '/app'
            : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all group ${
                isActive
                  ? 'bg-blue-500/15 text-blue-400 font-semibold'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`h-[18px] w-[18px] transition-transform group-hover:scale-110 ${isActive ? 'stroke-[2.5px]' : ''}`} />
              <span>{label}</span>
              {label === 'Notificações' && notifCount > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
              {label !== 'Notificações' && isActive && <div className="ml-auto w-1 h-4 bg-blue-400 rounded-full" />}
            </Link>
          )
        })}
      </nav>

      {/* Upgrade mini */}
      <div className="px-3 py-3 relative">
        <Link href="/app/planos" className="block">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-white/[0.06] hover:from-blue-500/15 hover:to-violet-500/15 transition-all">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold text-white/70">Upgrade</span>
            </div>
            <p className="text-[10px] text-white/30 mt-0.5">Mais benefícios</p>
          </div>
        </Link>
      </div>

      {/* Sair */}
      <div className="px-3 pb-5 relative">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
