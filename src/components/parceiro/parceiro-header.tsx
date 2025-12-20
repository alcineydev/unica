'use client'

import { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, LogOut, Building2, Users, ShoppingCart, ChevronDown } from 'lucide-react'

export function ParceiroHeader() {
  const { data: session } = useSession()
  const [parceiro, setParceiro] = useState<any>(null)
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    fetchParceiroData()
  }, [])

  const fetchParceiroData = async () => {
    try {
      const response = await fetch('/api/parceiro/me')
      const data = await response.json()
      if (data.parceiro) {
        setParceiro(data.parceiro)
      }
    } catch (error) {
      console.error('Erro ao buscar dados do parceiro:', error)
    }
  }

  const displayName = parceiro?.tradeName || parceiro?.companyName || session?.user?.name || session?.user?.email?.split('@')[0] || 'Parceiro'
  const displayEmail = session?.user?.email || ''
  const displayAvatar = parceiro?.logo || (session?.user as any)?.avatar || ''

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/parceiro" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <span className="font-semibold text-lg">UNICA</span>
            <Badge variant="secondary" className="ml-2 text-xs">Parceiro</Badge>
          </div>
        </Link>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {/* Notificações */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                variant="destructive"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </Button>

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={displayAvatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                  {displayName}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/parceiro/perfil" className="flex items-center cursor-pointer">
                  <Building2 className="mr-2 h-4 w-4" />
                  Perfil da Empresa
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/parceiro/clientes" className="flex items-center cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  Clientes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/parceiro/vendas" className="flex items-center cursor-pointer">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Vendas
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
