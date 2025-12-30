'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Search,
  CreditCard,
  User,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/app', icon: Home, label: 'Início' },
  { href: '/app/parceiros', icon: Search, label: 'Parceiros' },
  { href: '/app/beneficios', icon: Sparkles, label: 'Benefícios' },
  { href: '/app/carteirinha', icon: CreditCard, label: 'Carteirinha' },
  { href: '/app/perfil', icon: User, label: 'Perfil' },
]

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/app') return pathname === '/app'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-2 pb-safe lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full transition-all",
                active ? "text-brand-600" : "text-slate-400"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-all",
                active && "bg-brand-100"
              )}>
                <item.icon className={cn(
                  "w-5 h-5 transition-all",
                  active && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium mt-0.5",
                active && "text-brand-600"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
