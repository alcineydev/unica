'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { UserAvatar } from '@/components/ui/user-avatar'
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
  Bell,
  Menu,
  LogOut,
  X,
  Smartphone,
  ChevronDown,
  List,
  Tags,
  Plus,
  MessageCircle,
  Mail,
  User,
  type LucideIcon
} from 'lucide-react'

interface MenuChild {
  label: string
  href: string
  icon?: LucideIcon
  disabled?: boolean
  badge?: string
}

interface MenuItem {
  label: string
  icon: LucideIcon
  href?: string
  disabled?: boolean
  children?: MenuChild[]
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin'
  },
  {
    label: 'Parceiros',
    icon: Store,
    children: [
      { label: 'Todos os Parceiros', href: '/admin/parceiros', icon: List },
      { label: 'Categorias', href: '/admin/categorias', icon: Tags },
      { label: 'Cidades', href: '/admin/cidades', icon: MapPin },
      { label: '+ Novo Parceiro', href: '/admin/parceiros/novo', icon: Plus }
    ]
  },
  {
    label: 'Assinantes',
    icon: Users,
    children: [
      { label: 'Todos os Assinantes', href: '/admin/assinantes', icon: List },
      { label: 'Relatórios', href: '/admin/relatorios', icon: BarChart3 }
    ]
  },
  {
    label: 'Planos',
    icon: CreditCard,
    children: [
      { label: 'Todos os Planos', href: '/admin/planos', icon: List },
      { label: 'Benefícios', href: '/admin/beneficios', icon: Gift },
      { label: '+ Novo Plano', href: '/admin/planos/novo', icon: Plus }
    ]
  },
  {
    label: 'Notificações',
    icon: Bell,
    children: [
      { label: 'WhatsApp', href: '/admin/notificacoes', icon: MessageCircle },
      { label: 'Push', href: '/admin/notificacoes-push', icon: Smartphone },
      { label: 'Email', href: '#', icon: Mail, disabled: true, badge: 'Em breve' }
    ]
  },
  {
    label: 'Configurações',
    icon: Settings,
    children: [
      { label: 'Integrações', href: '/admin/integracoes', icon: Plug },
      { label: 'Perfil Admin', href: '/admin/configuracoes', icon: User }
    ]
  }
]

// Helper para verificar se um menu tem item ativo
function hasActiveChild(children: MenuChild[], pathname: string): boolean {
  return children.some(child =>
    pathname === child.href || pathname.startsWith(child.href + '/')
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  // Expandir automaticamente o menu que contém a rota atual
  useEffect(() => {
    const activeMenus: string[] = []
    menuItems.forEach(item => {
      if (item.children && hasActiveChild(item.children, pathname)) {
        activeMenus.push(item.label)
      }
    })
    setExpandedMenus(prev => {
      // Adicionar novos menus ativos sem remover os já expandidos manualmente
      const newExpanded = [...prev]
      activeMenus.forEach(menu => {
        if (!newExpanded.includes(menu)) {
          newExpanded.push(menu)
        }
      })
      return newExpanded
    })
  }, [pathname])

  // Fechar sidebar ao mudar de rota (mobile)
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label)
        ? prev.filter(m => m !== label)
        : [...prev, label]
    )
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Link href="/admin" className="flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold">Unica</span>
        </Link>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          // Item simples (sem filhos)
          if (!item.children) {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.label}
                href={item.href!}
                onClick={() => isMobile && setIsOpen(false)}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              </Link>
            )
          }

          // Item com filhos (expansível)
          const isExpanded = expandedMenus.includes(item.label)
          const hasActive = hasActiveChild(item.children, pathname)

          return (
            <div key={item.label}>
              {/* Item pai */}
              <button
                onClick={() => toggleMenu(item.label)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  hasActive
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-semibold flex-1 text-left">{item.label}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )}
                />
              </button>

              {/* Itens filhos */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="mt-1 space-y-1">
                  {item.children.map((child) => {
                    const isChildActive = pathname === child.href ||
                      pathname.startsWith(child.href + '/')
                    const ChildIcon = child.icon

                    if (child.disabled) {
                      return (
                        <div
                          key={child.href}
                          className="flex items-center gap-3 pl-8 pr-3 py-2 rounded-lg text-muted-foreground/50 cursor-not-allowed"
                        >
                          {ChildIcon && <ChildIcon className="h-4 w-4 flex-shrink-0" />}
                          <span className="text-sm flex-1">{child.label}</span>
                          {child.badge && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                              {child.badge}
                            </span>
                          )}
                        </div>
                      )
                    }

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => isMobile && setIsOpen(false)}
                      >
                        <div
                          className={cn(
                            "flex items-center gap-3 pl-8 pr-3 py-2 rounded-lg transition-colors",
                            isChildActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {ChildIcon && <ChildIcon className="h-4 w-4 flex-shrink-0" />}
                          <span className="text-sm flex-1">{child.label}</span>
                          {child.badge && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                              {child.badge}
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      {/* User Info + Botão Sair */}
      <div className="p-4 border-t space-y-3">
        {/* Info do usuário */}
        <div className="flex items-center gap-3">
          <UserAvatar
            src={session?.user?.avatar}
            name={session?.user?.name}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name || 'Admin'}</p>
            <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
          </div>
        </div>

        {/* Botão Sair - Fixo no rodapé */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b h-16">
        <div className="flex items-center justify-between h-full px-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SidebarContent isMobile />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold">Unica Admin</span>
          </div>

          <UserAvatar
            src={session?.user?.avatar}
            name={session?.user?.name}
            size="sm"
          />
        </div>
      </header>

      {/* Desktop Sidebar - Fixed width 256px (w-64) */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-background border-r z-40">
        <SidebarContent />
      </aside>
    </>
  )
}
