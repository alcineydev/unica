'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, Users, Building2 } from 'lucide-react'

const navItems = [
  { href: '/parceiro', label: 'Início', icon: Home },
  { href: '/parceiro/vendas', label: 'Vendas', icon: ShoppingBag },
  { href: '/parceiro/clientes', label: 'Clientes', icon: Users },
  { href: '/parceiro/perfil', label: 'Perfil', icon: Building2 },
]

export function ParceiroBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ backgroundColor: '#0b1120', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-full overflow-hidden">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/parceiro' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="flex flex-col items-center justify-center flex-1 min-w-0 gap-1 py-2 text-xs transition-colors relative"
            >
              {/* Barra indicadora no topo do item ativo */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[3px] bg-emerald-400 rounded-b" />
              )}
              <Icon
                className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'text-white/35'
                  }`}
                strokeWidth={1.8}
              />
              <span className={`truncate transition-colors ${isActive ? 'text-emerald-400' : 'text-white/35'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
