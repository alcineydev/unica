'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingCart, Users, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/parceiro', label: 'Início', icon: Home },
  { href: '/parceiro/vendas', label: 'Vendas', icon: ShoppingCart },
  { href: '/parceiro/clientes', label: 'Clientes', icon: Users },
  { href: '/parceiro/perfil', label: 'Perfil', icon: Building2 },
]

export function ParceiroBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around h-16 max-w-full overflow-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/parceiro' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 min-w-0 gap-1 py-2 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
