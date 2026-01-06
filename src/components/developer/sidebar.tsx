'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Database,
  KeyRound,
  ScrollText,
  Terminal
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/developer',
    icon: LayoutDashboard,
  },
  {
    title: 'Administradores',
    href: '/developer/admins',
    icon: Shield,
  },
  {
    title: 'Logs do Sistema',
    href: '/developer/logs',
    icon: ScrollText,
  },
  {
    title: 'Sistema',
    icon: Database,
    submenu: [
      { title: 'PWA / App', href: '/developer/pwa' },
      { title: 'Branding', href: '/developer/sistema' },
      { title: 'Páginas', href: '/developer/paginas' },
      { title: 'Configurações', href: '/developer/configuracoes' },
    ]
  },
  {
    title: 'Minha Conta',
    icon: KeyRound,
    submenu: [
      { title: 'Alterar E-mail', href: '/developer/conta/email' },
      { title: 'Alterar Senha', href: '/developer/conta/senha' },
    ]
  },
]

export function DeveloperSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([])

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => {
    if (href === '/developer') return pathname === '/developer'
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <Link href="/developer" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Terminal className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <span className="text-white text-lg font-bold font-mono">UNICA</span>
            <span className="text-emerald-400 text-xs block font-mono">// developer</span>
          </div>
        </Link>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.title}>
            {item.submenu ? (
              <>
                <button
                  onClick={() => toggleSubmenu(item.title)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all font-mono",
                    openSubmenus.includes(item.title)
                      ? "bg-slate-800 text-emerald-400"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.title}
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    openSubmenus.includes(item.title) && "rotate-180"
                  )} />
                </button>
                {openSubmenus.includes(item.title) && (
                  <div className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1">
                    {item.submenu.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "block px-4 py-2 rounded-lg text-sm transition-all font-mono",
                          isActive(sub.href)
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
                        )}
                      >
                        <span className="text-slate-600 mr-1">&gt;</span> {sub.title}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href!}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all font-mono",
                  isActive(item.href!)
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.title}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all font-mono"
        >
          <LogOut className="w-5 h-5" />
          logout()
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-emerald-400 rounded-xl shadow-lg border border-slate-700"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 flex flex-col transform transition-transform duration-300 border-r border-slate-800",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 flex-col border-r border-slate-800">
        <SidebarContent />
      </aside>
    </>
  )
}
