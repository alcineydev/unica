'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  ScrollText,
  Smartphone,
  Palette,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  Database,
  Code2,
  Menu,
  X,
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/developer',
    icon: LayoutDashboard,
  },
  {
    name: 'Administradores',
    href: '/developer/admins',
    icon: Users,
  },
  {
    name: 'Logs do Sistema',
    href: '/developer/logs',
    icon: ScrollText,
  },
  {
    name: 'Monitoramento',
    href: '/developer/monitoramento',
    icon: Activity,
  },
  {
    name: 'Banco de Dados',
    href: '/developer/database',
    icon: Database,
  },
  {
    name: 'PWA / App',
    href: '/developer/pwa',
    icon: Smartphone,
  },
  {
    name: 'Sistema',
    href: '/developer/sistema',
    icon: Palette,
  },
  {
    name: 'Páginas',
    href: '/developer/paginas',
    icon: FileText,
  },
  {
    name: 'Configurações',
    href: '/developer/configuracoes',
    icon: Settings,
  },
]

export function DeveloperSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/developer') {
      return pathname === '/developer'
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
        <Link href="/developer" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/20">
            <Shield className="h-5 w-5 text-red-500" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Developer</span>
              <span className="text-[10px] text-zinc-500">Painel de Controle</span>
            </div>
          )}
        </Link>

        {/* Collapse button - desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {/* Close button - mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href)
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    active
                      ? 'bg-red-500/20 text-red-400'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', active && 'text-red-400')} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-3">
        <div className={cn(
          'flex items-center gap-3 rounded-lg bg-zinc-800/50 px-3 py-2',
          collapsed && 'justify-center'
        )}>
          <Code2 className="h-4 w-4 text-red-400" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-medium text-zinc-300">Acesso Developer</span>
              <span className="text-[10px] text-zinc-500">Modo Avançado</span>
            </div>
          )}
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-white lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-zinc-950 transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
