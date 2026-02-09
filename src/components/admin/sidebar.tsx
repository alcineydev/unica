'use client'

import { useState, useEffect, useRef, type MouseEvent } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Bell,
  Settings,
  ChevronRight,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/contexts/sidebar-context'
import { LogoDisplay } from '@/components/ui/logo-display'

interface NavChild {
  label: string
  href: string
  badge?: string
  disabled?: boolean
}

interface NavItem {
  label: string
  href?: string
  icon: React.ElementType
  children?: NavChild[]
}

const navigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    label: 'Parceiros',
    icon: Building2,
    children: [
      { label: 'Todos os Parceiros', href: '/admin/parceiros' },
      { label: 'Categorias', href: '/admin/categorias' },
      { label: 'Cidades', href: '/admin/cidades' },
      { label: '+ Novo Parceiro', href: '/admin/parceiros/novo' },
    ]
  },
  {
    label: 'Assinantes',
    icon: Users,
    children: [
      { label: 'Todos os Assinantes', href: '/admin/assinantes' },
      { label: 'Relatórios', href: '/admin/relatorios' },
    ]
  },
  {
    label: 'Planos',
    icon: CreditCard,
    children: [
      { label: 'Gerenciar Planos', href: '/admin/planos' },
      { label: 'Benefícios', href: '/admin/beneficios' },
      { label: '+ Novo Plano', href: '/admin/planos/novo' },
    ]
  },
  {
    label: 'Notificações',
    icon: Bell,
    children: [
      { label: 'WhatsApp', href: '/admin/notificacoes' },
      { label: 'Push', href: '/admin/notificacoes-push' },
      { label: 'Email', href: '#', disabled: true, badge: 'Em breve' },
    ]
  },
  {
    label: 'Configurações',
    icon: Settings,
    children: [
      { label: 'Meu Perfil', href: '/admin/configuracoes' },
      { label: 'Integrações', href: '/admin/integracoes' },
      { label: 'Cron Vencimentos', href: '/admin/cron' },
      { label: 'Diagnóstico Push', href: '/admin/diagnostics/push' },
    ]
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [activePopover, setActivePopover] = useState<string | null>(null)
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null)
  const { isCollapsed, toggle, isMobileOpen, closeMobile } = useSidebar()

  // Refs para preservar posição do scroll e fechar popover por clique externo
  const navRef = useRef<HTMLElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef(0)

  // Funções para salvar/restaurar posição do scroll
  const saveScrollPosition = () => {
    if (navRef.current) {
      scrollPositionRef.current = navRef.current.scrollTop
    }
  }

  const restoreScrollPosition = () => {
    if (navRef.current) {
      navRef.current.scrollTop = scrollPositionRef.current
    }
  }

  // Fechar popover ao clicar fora da sidebar
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (activePopover && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setActivePopover(null)
        setPopoverPosition(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activePopover])

  // Fechar sidebar mobile e popover ao mudar de rota, preservando scroll
  useEffect(() => {
    saveScrollPosition()
    const raf = requestAnimationFrame(() => {
      closeMobile()
      setActivePopover(null)
      setPopoverPosition(null)
      restoreScrollPosition()
    })
    return () => cancelAnimationFrame(raf)
  }, [pathname, closeMobile])

  const toggleMobileExpanded = (label: string) => {
    saveScrollPosition()
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
    requestAnimationFrame(restoreScrollPosition)
  }

  const togglePopover = (label: string, event: MouseEvent<HTMLButtonElement>) => {
    if (activePopover === label) {
      setActivePopover(null)
      setPopoverPosition(null)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    setPopoverPosition({
      top: rect.top,
      left: rect.right + 8
    })
    setActivePopover(label)
  }

  const isActive = (href?: string, children?: NavChild[]) => {
    if (href && pathname === href) return true
    if (children) return children.some(child => pathname === child.href || pathname.startsWith(child.href + '/'))
    return false
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/admin" className="flex items-center">
          <LogoDisplay
            variant="dark"
            showText={!isCollapsed}
            textClassName="text-white max-w-[140px]"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="flex-1 p-4 space-y-1 overflow-y-auto scroll-smooth">
        {navigation.map((item) => (
          <div key={item.label} className="relative">
            {item.href ? (
              // Link direto
              <Link
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isCollapsed ? "justify-center" : "gap-3",
                  isActive(item.href)
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                {!isCollapsed && item.label}
              </Link>
            ) : (
              // Com submenu
              <>
                <button
                  onClick={(e) => {
                    if (window.innerWidth >= 1024) {
                      togglePopover(item.label, e)
                    } else {
                      toggleMobileExpanded(item.label)
                    }
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isCollapsed ? "justify-center" : "justify-between",
                    activePopover === item.label
                      ? "bg-white/10 text-white"
                      : isActive(undefined, item.children)
                        ? "bg-white/5 text-white"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                    <item.icon className="w-5 h-5" />
                    {!isCollapsed && item.label}
                  </div>
                  {!isCollapsed && (
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform duration-150",
                      activePopover === item.label ? "rotate-90" : ""
                    )} />
                  )}
                </button>

                {/* Submenu inline (mobile) */}
                {expandedItems.includes(item.label) && item.children && (
                  <div className="mt-1 ml-4 pl-4 border-l border-white/10 space-y-1 lg:hidden">
                    {item.children.map((child) => (
                      child.disabled ? (
                        <div
                          key={child.href}
                          className="flex items-center justify-between px-4 py-2 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                        >
                          <span>{child.label}</span>
                          {child.badge && (
                            <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full">
                              {child.badge}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block px-4 py-2 rounded-lg text-sm transition-all",
                            pathname === child.href || pathname.startsWith(child.href + '/')
                              ? "bg-brand-600 text-white shadow-md"
                              : "text-slate-400 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          {child.label}
                        </Link>
                      )
                    ))}
                  </div>
                )}

                {/* Popover submenu (desktop) */}
                {activePopover === item.label && item.children && popoverPosition && (
                  <div
                    className="hidden lg:block fixed w-56 bg-navy-800 rounded-xl shadow-xl p-2 z-[100] border border-white/10 animate-in fade-in-0 zoom-in-95"
                    style={{
                      top: popoverPosition.top,
                      left: popoverPosition.left
                    }}
                  >
                    {item.children.map((child) => (
                      child.disabled ? (
                        <div
                          key={child.href}
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                        >
                          <span>{child.label}</span>
                          {child.badge && (
                            <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full">
                              {child.badge}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setActivePopover(null)}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                            pathname === child.href || pathname.startsWith(child.href + '/')
                              ? "bg-brand-600 text-white shadow-md"
                              : "text-slate-300 hover:bg-white/10"
                          )}
                        >
                          <span>{child.label}</span>
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </Link>
                      )
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="space-y-2">
          <button
            onClick={toggle}
            className="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all"
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            {!isCollapsed && <span>Recolher menu</span>}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all",
              isCollapsed ? "justify-center" : ""
            )}
            title={isCollapsed ? "Sair" : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobile}
        />
      )}

      <div ref={sidebarRef}>
        {/* Sidebar Mobile */}
        <aside className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-navy-900 flex flex-col transform transition-transform duration-300",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <button
            onClick={closeMobile}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            aria-label="Fechar menu lateral"
          >
            <X className="w-6 h-6" />
          </button>
          {sidebarContent}
        </aside>

        {/* Sidebar Desktop */}
        <aside
          className={cn(
            "hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col shadow-xl transition-all duration-300",
            isCollapsed ? "w-20" : "w-64",
            "bg-navy-900"
          )}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  )
}
