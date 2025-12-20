'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, CreditCard, Star, User } from 'lucide-react'

const navItems = [
  {
    title: 'Início',
    href: '/app',
    icon: Home,
  },
  {
    title: 'Carteira',
    href: '/app/carteira',
    icon: CreditCard,
  },
  {
    title: 'Avaliações',
    href: '/app/minhas-avaliacoes',
    icon: Star,
  },
  {
    title: 'Perfil',
    href: '/app/perfil',
    icon: User,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 max-w-full overflow-hidden lg:hidden">
      <div className="flex h-16 items-center justify-around max-w-full overflow-hidden px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/app' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-2 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'fill-primary/20')} />
              <span className="font-medium truncate">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

