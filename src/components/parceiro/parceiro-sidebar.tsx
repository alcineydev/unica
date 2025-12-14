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
  Gift,
  QrCode,
  Users,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  X,
  Building2,
  Star,
  MessageCircle
} from 'lucide-react'

const menuItems = [
  { href: '/parceiro', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/parceiro/beneficios', label: 'Meus Benefícios', icon: Gift },
  { href: '/parceiro/validacoes', label: 'Validações', icon: QrCode },
  { href: '/parceiro/clientes', label: 'Clientes', icon: Users },
  { href: '/parceiro/avaliacoes', label: 'Avaliações', icon: Star },
  { href: '/parceiro/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/parceiro/configuracoes', label: 'Configurações', icon: Settings },
]

export function ParceiroSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  // Fechar sidebar ao mudar de rota (mobile)
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-bold text-lg block truncate">Painel Parceiro</span>
        </div>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
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
            (item.href !== '/parceiro' && pathname.startsWith(item.href))
          
          return (
            <Link key={item.href} href={item.href} onClick={() => isMobile && setIsOpen(false)}>
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
        })}
      </nav>

      {/* Suporte WhatsApp */}
      <div className="p-4 border-t">
        <a 
          href="https://wa.me/5566999999999?text=Olá, preciso de ajuda com o painel parceiro"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="w-full justify-start" size="sm">
            <MessageCircle className="mr-2 h-4 w-4 text-green-500" />
            Suporte
          </Button>
        </a>
      </div>

      {/* User */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <UserAvatar
            src={session?.user?.avatar}
            name={session?.user?.name}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
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
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b h-16">
        <div className="flex items-center justify-between px-4 h-full">
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
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-bold">Painel Parceiro</span>
          </div>

          <UserAvatar
            src={session?.user?.avatar}
            name={session?.user?.name}
            size="sm"
          />
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-background border-r z-40">
        <SidebarContent />
      </aside>
    </>
  )
}

