'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Users,
  ScrollText,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Smartphone,
  Palette,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/developer',
    icon: LayoutDashboard,
  },
  {
    title: 'Administradores',
    href: '/developer/admins',
    icon: Users,
  },
  {
    title: 'Logs do Sistema',
    href: '/developer/logs',
    icon: ScrollText,
  },
  {
    title: 'PWA / App',
    href: '/developer/pwa',
    icon: Smartphone,
  },
  {
    title: 'Sistema',
    href: '/developer/sistema',
    icon: Palette,
  },
  {
    title: 'Páginas',
    href: '/developer/paginas',
    icon: FileText,
  },
  {
    title: 'Configurações',
    href: '/developer/configuracoes',
    icon: Settings,
  },
]

export function DeveloperSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-zinc-950 text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
        {!collapsed && (
          <Link href="/developer" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-500" />
            <span className="font-bold text-lg">Developer</span>
          </Link>
        )}
        {collapsed && (
          <Shield className="h-6 w-6 text-red-500 mx-auto" />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                isActive
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
                collapsed && 'justify-center px-2'
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
      <div className="border-t border-zinc-800 p-4">
        {!collapsed && (
          <p className="text-xs text-zinc-500 text-center">
            Acesso Developer
          </p>
        )}
      </div>
    </aside>
  )
}
