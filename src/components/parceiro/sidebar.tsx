'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Star,
  BarChart3,
  Building2,
  Wallet,
  LogOut,
  Menu,
  X,
  Sparkles
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/parceiro', icon: LayoutDashboard },
  { label: 'Vendas', href: '/parceiro/vendas', icon: ShoppingCart },
  { label: 'Clientes', href: '/parceiro/clientes', icon: Users },
  { label: 'Meu Saldo', href: '/parceiro/saldo', icon: Wallet },
  { label: 'Avaliações', href: '/parceiro/avaliacoes', icon: Star },
  { label: 'Relatórios', href: '/parceiro/relatorios', icon: BarChart3 },
  { label: 'Perfil da Empresa', href: '/parceiro/perfil', icon: Building2 },
]

export function ParceiroSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/parceiro') return pathname === '/parceiro'
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/parceiro" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white text-xl font-bold">UNICA</span>
            <span className="text-slate-400 text-xs block">Parceiro</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              isActive(item.href)
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 rounded-xl text-white shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Mobile */}
      <aside className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 flex flex-col transform transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        <SidebarContent />
      </aside>

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 flex-col shadow-xl">
        <SidebarContent />
      </aside>
    </>
  )
}
