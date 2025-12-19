'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, QrCode, BarChart3, Store } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/parceiro', label: 'Início', icon: Home },
  { href: '/parceiro/validacoes', label: 'Validar', icon: QrCode },
  { href: '/parceiro/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/parceiro/perfil', label: 'Perfil', icon: Store },
]

export function ParceiroBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/parceiro' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
