'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Gift,
  QrCode,
  Users,
  BarChart3,
  Settings,
  Star,
  Store,
  MessageCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const menuItems = [
  { href: '/parceiro', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/parceiro/validacoes', label: 'Validar QR Code', icon: QrCode },
  { href: '/parceiro/beneficios', label: 'Meus Benefícios', icon: Gift },
  { href: '/parceiro/clientes', label: 'Clientes', icon: Users },
  { href: '/parceiro/avaliacoes', label: 'Avaliações', icon: Star },
  { href: '/parceiro/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/parceiro/perfil', label: 'Perfil da Empresa', icon: Store },
  { href: '/parceiro/configuracoes', label: 'Configurações', icon: Settings },
]

export function ParceiroSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-zinc-50/50 dark:bg-zinc-900/50 h-[calc(100vh-56px)]">
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/parceiro' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Suporte WhatsApp */}
      <div className="p-4 border-t">
        <a
          href="https://wa.me/5566999999999?text=Olá, preciso de ajuda com o painel parceiro"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="w-full justify-start" size="sm">
            <MessageCircle className="mr-2 h-4 w-4 text-green-500" />
            Suporte via WhatsApp
          </Button>
        </a>
      </div>
    </aside>
  )
}
