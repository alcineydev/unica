'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  MapPin,
  Gift,
  CreditCard,
  Store,
  Users,
  Settings,
  BarChart3,
  Plug,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Bell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Cidades',
    href: '/admin/cidades',
    icon: MapPin,
  },
  {
    title: 'Benefícios',
    href: '/admin/beneficios',
    icon: Gift,
  },
  {
    title: 'Planos',
    href: '/admin/planos',
    icon: CreditCard,
  },
  {
    title: 'Parceiros',
    href: '/admin/parceiros',
    icon: Store,
  },
  {
    title: 'Assinantes',
    href: '/admin/assinantes',
    icon: Users,
  },
  {
    title: 'Notificações',
    href: '/admin/notificacoes',
    icon: Bell,
  },
  {
    title: 'Integrações',
    href: '/admin/integracoes',
    icon: Plug,
  },
  {
    title: 'Relatórios',
    href: '/admin/relatorios',
    icon: BarChart3,
  },
  {
    title: 'Configurações',
    href: '/admin/configuracoes',
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-screen border-r bg-card transition-all duration-300',
        collapsed ? 'w-[70px]' : 'w-[250px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          {!collapsed && <span className="text-xl font-bold">Unica</span>}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Menu */}
      <nav className="flex flex-col gap-1 p-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              Painel Administrativo
            </p>
            <p className="text-xs font-medium">Grupo Zan Norte</p>
          </div>
        </div>
      )}
    </aside>
  )
}
