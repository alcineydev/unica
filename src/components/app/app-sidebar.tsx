'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import {
  Home, Search, CreditCard, Store, Star,
  Bell, User, LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { icon: Home, label: 'Início', href: '/app' },
  { icon: Search, label: 'Buscar', href: '/app/buscar' },
  { icon: CreditCard, label: 'Carteira', href: '/app/carteira' },
  { icon: Store, label: 'Parceiros', href: '/app/parceiros' },
  { icon: Star, label: 'Avaliações', href: '/app/minhas-avaliacoes' },
  { icon: Bell, label: 'Notificações', href: '/app/notificacoes' },
  { icon: User, label: 'Meu Perfil', href: '/app/perfil' },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-gray-200 bg-white h-[calc(100vh-64px)] sticky top-16">
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = href === '/app'
            ? pathname === '/app'
            : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Icon className={`h-[18px] w-[18px] ${isActive ? 'stroke-[2.5px]' : ''}`} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>Sair</span>
        </Button>
      </div>
    </aside>
  )
}
