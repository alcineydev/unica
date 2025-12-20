'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Home,
  Gift,
  CreditCard,
  Store,
  Star,
  User,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { href: '/app', label: 'Início', icon: Home },
  { href: '/app/beneficios', label: 'Benefícios', icon: Gift },
  { href: '/app/carteira', label: 'Carteira', icon: CreditCard },
  { href: '/app/parceiros', label: 'Parceiros', icon: Store },
  { href: '/app/minhas-avaliacoes', label: 'Minhas Avaliações', icon: Star },
  { href: '/app/perfil', label: 'Meu Perfil', icon: User },
]

export function AppSidebar() {
  const pathname = usePathname()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <aside className="hidden lg:flex w-64 flex-col h-[calc(100vh-56px)] sticky top-14 border-r bg-zinc-50/50 dark:bg-zinc-900/50">
      {/* Menu Items */}
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/app' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Botão Sair - Fixo na parte inferior */}
      <div className="p-3 border-t mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  )
}
