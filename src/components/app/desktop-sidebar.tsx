'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Home,
  Search,
  CreditCard,
  User,
  Sparkles,
  Bell,
  LogOut,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mainNav = [
  { href: '/app', icon: Home, label: 'Início' },
  { href: '/app/parceiros', icon: Search, label: 'Parceiros' },
  { href: '/app/beneficios', icon: Sparkles, label: 'Benefícios' },
  { href: '/app/carteirinha', icon: CreditCard, label: 'Carteirinha' },
]

const secondaryNav = [
  { href: '/app/notificacoes', icon: Bell, label: 'Notificações' },
  { href: '/app/perfil', icon: User, label: 'Meu Perfil' },
  { href: '/app/ajuda', icon: HelpCircle, label: 'Ajuda' },
]

export function DesktopSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (href: string) => {
    if (href === '/app') return pathname === '/app'
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <Link href="/app" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">U</span>
          </div>
          <div>
            <span className="text-slate-900 text-xl font-bold">UNICA</span>
            <span className="text-slate-400 text-xs block">Clube de Benefícios</span>
          </div>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">
              {session?.user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {session?.user?.name || 'Usuário'}
            </p>
            <p className="text-xs text-slate-500">Assinante</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
          Menu
        </p>
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              isActive(item.href)
                ? "bg-brand-50 text-brand-600"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}

        <div className="pt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
            Conta
          </p>
          {secondaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive(item.href)
                  ? "bg-brand-50 text-brand-600"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  )
}
