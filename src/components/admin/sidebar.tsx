'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/theme-toggle'
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

  const displayName = session?.user?.name || 'Admin'
  const displayEmail = session?.user?.email || ''
  const displayAvatar = (session?.user as { avatar?: string })?.avatar || ''

  // Conteúdo do Menu (usado em mobile e desktop)
  const MenuContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
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
                    ? "bg-blue-600 text-white"
                    : "hover:bg-blue-50 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-slate-800"
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
            <button
              onClick={() => toggleMenu(item.label)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                hasActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "hover:bg-blue-50 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-slate-800"
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
                            ? "bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/20 dark:text-blue-400"
                            : "hover:bg-blue-50 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-slate-800"
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
    </>
  )

  return (
    <>
      {/* ========== HEADER FIXO NO TOPO (Mobile e Desktop) ========== */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between h-full px-4">
          {/* Esquerda: Menu hambúrguer (mobile) + Logo */}
          <div className="flex items-center gap-3">
            {/* Menu hambúrguer - apenas mobile */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <div className="flex flex-col h-full">
                  {/* Header do Sheet */}
                  <div className="p-4 border-b">
                    <span className="font-bold text-lg">Menu</span>
                  </div>

                  {/* Menu Items */}
                  <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                    <MenuContent isMobile />
                  </nav>

                  {/* Botão Sair - Fixo no rodapé */}
                  <div className="p-3 border-t">
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
                    >
                      <LogOut className="h-5 w-5" />
                      Sair
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-semibold text-lg">UNICA</span>
                <Badge variant="secondary" className="ml-2 text-xs">Admin</Badge>
              </div>
            </Link>
          </div>

          {/* Direita: ThemeToggle + Notificações + Avatar */}
          <div className="flex items-center gap-2">
            {/* Toggle de Tema */}
            <ThemeToggle />

            {/* Sino de notificações */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
            </Button>

            {/* Avatar com nome */}
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={displayAvatar} />
                <AvatarFallback className="bg-blue-50 text-blue-600 text-sm dark:bg-blue-900/20 dark:text-blue-400">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-medium max-w-[120px] truncate">
                {displayName}
              </span>
              <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </header>

      {/* ========== SIDEBAR DESKTOP (abaixo do header) ========== */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-14 bottom-0 w-64 bg-background border-r z-40">
        {/* Menu com scroll */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          <MenuContent />
        </nav>

        {/* Botão Sair - Fixo no rodapé */}
        <div className="p-3 border-t">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
