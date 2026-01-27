'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  Gift,
  MapPin,
  Tag,
  LogOut,
  Menu,
  X,
  List,
  Plus,
  MessageCircle,
  Smartphone,
  Mail,
  Plug,
  BarChart3,
  Clock
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

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
      { label: 'Geral', href: '/admin/configuracoes' },
      { label: 'Integrações', href: '/admin/integracoes' },
      { label: 'Cron Vencimentos', href: '/admin/cron' },
      { label: 'Diagnóstico Push', href: '/admin/diagnostics/push' },
    ]
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['Parceiros', 'Assinantes'])
  const [mobileOpen, setMobileOpen] = useState(false)
  
  // Refs para preservar posição do scroll
  const navRef = useRef<HTMLElement>(null)
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

  // Expandir automaticamente o menu que contém a rota atual
  useEffect(() => {
    saveScrollPosition()
    
    const activeMenus: string[] = []
    navigation.forEach(item => {
      if (item.children?.some(child => pathname === child.href || pathname.startsWith(child.href + '/'))) {
        activeMenus.push(item.label)
      }
    })
    setExpandedItems(prev => {
      const newExpanded = [...prev]
      activeMenus.forEach(menu => {
        if (!newExpanded.includes(menu)) {
          newExpanded.push(menu)
        }
      })
      return newExpanded
    })
    
    requestAnimationFrame(restoreScrollPosition)
  }, [pathname])

  // Fechar sidebar ao mudar de rota (mobile)
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const toggleExpanded = (label: string) => {
    saveScrollPosition()
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
    requestAnimationFrame(restoreScrollPosition)
  }

  const isActive = (href?: string, children?: NavChild[]) => {
    if (href && pathname === href) return true
    if (children) return children.some(child => pathname === child.href || pathname.startsWith(child.href + '/'))
    return false
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">U</span>
          </div>
          <div>
            <span className="text-white text-xl font-bold">UNICA</span>
            <span className="text-slate-400 text-xs block">Admin</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="flex-1 p-4 space-y-1 overflow-y-auto scroll-smooth">
        {navigation.map((item) => (
          <div key={item.label}>
            {item.href ? (
              // Link direto
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive(item.href)
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ) : (
              // Com submenu
              <>
                <button
                  onClick={() => toggleExpanded(item.label)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive(undefined, item.children)
                      ? "bg-white/10 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  {expandedItems.includes(item.label)
                    ? <ChevronDown className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />
                  }
                </button>

                {expandedItems.includes(item.label) && item.children && (
                  <div className="mt-1 ml-4 pl-4 border-l border-white/10 space-y-1">
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
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-navy-900 rounded-xl text-white shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Mobile */}
      <aside className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-navy-900 flex flex-col transform transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        <SidebarContent />
      </aside>

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-72 bg-navy-900 flex-col shadow-xl">
        <SidebarContent />
      </aside>
    </>
  )
}
