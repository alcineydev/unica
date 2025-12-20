'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  ShoppingCart,
  Users,
  Star,
  BarChart3,
  Building2,
  MessageCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { href: '/parceiro', label: 'Dashboard', icon: Home },
  { href: '/parceiro/vendas', label: 'Vendas', icon: ShoppingCart },
  { href: '/parceiro/clientes', label: 'Clientes', icon: Users },
  { href: '/parceiro/avaliacoes', label: 'Avaliações', icon: Star },
  { href: '/parceiro/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/parceiro/perfil', label: 'Perfil da Empresa', icon: Building2 },
]

export function ParceiroSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-zinc-50/50 dark:bg-zinc-900/50">
      <div className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/parceiro' && pathname.startsWith(item.href))

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

      {/* Link de Suporte */}
      <div className="p-3 border-t">
        <a
          href="https://wa.me/5566999999999"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          Suporte WhatsApp
        </a>
      </div>
    </aside>
  )
}
