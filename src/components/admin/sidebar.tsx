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
  ChevronLeft,
  Bell,
  Menu,
  LogOut,
  X
} from 'lucide-react'

const menuItems = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Cidades', href: '/admin/cidades', icon: MapPin },
  { title: 'Benefícios', href: '/admin/beneficios', icon: Gift },
  { title: 'Planos', href: '/admin/planos', icon: CreditCard },
  { title: 'Parceiros', href: '/admin/parceiros', icon: Store },
  { title: 'Assinantes', href: '/admin/assinantes', icon: Users },
  { title: 'Notificações', href: '/admin/notificacoes', icon: Bell },
  { title: 'Integrações', href: '/admin/integracoes', icon: Plug },
  { title: 'Relatórios', href: '/admin/relatorios', icon: BarChart3 },
  { title: 'Configurações', href: '/admin/configuracoes', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Fechar sidebar ao mudar de rota (mobile)
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 p-4 border-b",
        isCollapsed && !isMobile && "justify-center"
      )}>
        <Link href="/admin" className="flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          {(!isCollapsed || isMobile) && (
            <span className="text-xl font-bold">Unica</span>
          )}
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
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(item.href))
          
          return (
            <Link key={item.href} href={item.href} onClick={() => isMobile && setIsOpen(false)}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground",
                  isCollapsed && !isMobile && "justify-center"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isMobile) && (
                  <span className="text-sm font-medium">{item.title}</span>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className={cn(
        "p-4 border-t",
        isCollapsed && !isMobile && "flex justify-center"
      )}>
        {(!isCollapsed || isMobile) ? (
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-3">
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

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-background border-r z-40 transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-64"
      )}>
        <SidebarContent />
        
        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-background shadow-md"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform",
            isCollapsed && "rotate-180"
          )} />
        </Button>
      </aside>

      {/* Spacer for content - Desktop only */}
      <div className={cn(
        "hidden lg:block flex-shrink-0 transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-64"
      )} />
    </>
  )
}
