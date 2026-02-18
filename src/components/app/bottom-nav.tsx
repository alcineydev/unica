'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Search, CreditCard, Store, User } from 'lucide-react'

const items = [
  { icon: Home, label: 'Início', href: '/app' },
  { icon: Search, label: 'Buscar', href: '/app/buscar' },
  { icon: CreditCard, label: 'Carteira', href: '/app/carteira' },
  { icon: Store, label: 'Parceiros', href: '/app/parceiros' },
  { icon: User, label: 'Perfil', href: '/app/perfil' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav data-bottom-nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {items.map(({ icon: Icon, label, href }) => {
          const isActive = href === '/app'
            ? pathname === '/app'
            : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors ${isActive
                ? 'text-blue-600'
                : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
              <span className={`text-[10px] leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
