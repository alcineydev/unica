'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutGrid,
  ShoppingBag,
  Users,
  CreditCard,
  Star,
  BarChart3,
  Building2,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/parceiro', label: 'Dashboard', icon: LayoutGrid },
  { href: '/parceiro/vendas', label: 'Vendas', icon: ShoppingBag },
  { href: '/parceiro/clientes', label: 'Clientes', icon: Users },
  { href: '/parceiro/saldo', label: 'Meu Saldo', icon: CreditCard },
  { href: '/parceiro/avaliacoes', label: 'Avaliações', icon: Star },
  { href: '/parceiro/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/parceiro/perfil', label: 'Perfil da Empresa', icon: Building2 },
]

export function ParceiroSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (href: string) => {
    if (href === '/parceiro') return pathname === '/parceiro'
    return pathname.startsWith(href)
  }

  const userName = session?.user?.name || 'Parceiro'
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <aside
      className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-72 lg:flex-col"
      style={{ backgroundColor: '#0b1120' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3.5 px-6 pt-7 pb-6">
        <div className="w-11 h-11 rounded-[14px] bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/30 flex-shrink-0">
          <span className="text-white font-extrabold text-xl">U</span>
        </div>
        <div>
          <div className="text-white font-extrabold text-xl tracking-tight">UNICA</div>
          <div className="text-white/40 text-xs font-medium mt-0.5">Clube de Benefícios</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={[
                'relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-emerald-500/15 text-white font-semibold'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04]',
              ].join(' ')}
            >
              <Icon
                className={`w-[22px] h-[22px] flex-shrink-0 ${active ? 'text-emerald-500' : ''}`}
                strokeWidth={1.8}
              />
              {item.label}

              {/* Barra verde lateral no item ativo */}
              {active && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-emerald-500 rounded-l" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center border-2 border-white/10 flex-shrink-0">
            <span className="text-white font-bold text-sm">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white/85 text-sm font-semibold truncate">{userName}</div>
            <div className="text-emerald-500 text-xs font-semibold mt-0.5 flex items-center gap-1">
              <span className="text-[10px]">🏪</span> Parceiro
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="px-5 pb-6">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 text-white/40 hover:text-red-400 transition-colors text-sm w-full"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={1.8} />
          Sair
        </button>
      </div>
    </aside>
  )
}
