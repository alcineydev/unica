'use client'

import { useState, useEffect, useRef } from 'react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { Bell, LogOut, User, ChevronDown, CreditCard, Star } from 'lucide-react'
import { NotificationModal } from './notification-modal'

interface AppHeaderProps {
  userName?: string
  userEmail?: string
  userAvatar?: string
}

interface NewNotification {
  title: string
  message: string
  type: string
  link?: string
}

export function AppHeader({ userName, userEmail, userAvatar }: AppHeaderProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [notificationCount, setNotificationCount] = useState(0)
  const [lastCount, setLastCount] = useState(0)
  const isFirstRender = useRef(true)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [newNotification, setNewNotification] = useState<NewNotification | null>(null)

  const displayName = userName || session?.user?.name || session?.user?.email?.split('@')[0] || 'Usuário'
  const displayEmail = userEmail || session?.user?.email || ''
  const displayAvatar = userAvatar || (session?.user as any)?.avatar || ''

  // Polling de notificações
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/app/notifications/count')
        const data = await response.json()
        const newCount = data.count || 0

        // Se não é a primeira renderização e tem novas notificações
        if (!isFirstRender.current && newCount > lastCount) {
          // Buscar a última notificação para mostrar no modal
          try {
            const notifResponse = await fetch('/api/app/notifications?limit=1')
            const notifData = await notifResponse.json()

            if (notifData.notifications && notifData.notifications.length > 0) {
              const lastNotif = notifData.notifications[0]
              let link = undefined

              // Tentar extrair link dos dados
              if (lastNotif.dados) {
                try {
                  const parsedData = typeof lastNotif.dados === 'string'
                    ? JSON.parse(lastNotif.dados)
                    : lastNotif.dados
                  link = parsedData.link || (parsedData.parceiroId ? `/app/avaliar/${parsedData.parceiroId}` : undefined)
                } catch (e) {
                  // Ignore parsing errors
                }
              }

              setNewNotification({
                title: lastNotif.titulo,
                message: lastNotif.mensagem,
                type: lastNotif.tipo,
                link
              })
              setShowModal(true)
            }
          } catch (e) {
            console.error('Erro ao buscar notificação:', e)
          }
        }

        setLastCount(newCount)
        setNotificationCount(newCount)
        isFirstRender.current = false
      } catch (error) {
        // Silently fail - notifications are not critical
      }
    }

    // Buscar imediatamente
    fetchNotifications()

    // Polling a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [lastCount])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 lg:px-6">
          {/* Logo */}
          <Link href="/app" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">U</span>
            </div>
            <span className="font-semibold">UNICA</span>
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Assinante</Badge>
          </Link>

          {/* Ações */}
          <div className="flex items-center gap-2">
            {/* Notificações */}
            <Link href="/app/notificacoes">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
                    variant="destructive"
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Badge>
                )}
              </Button>
            </Link>

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
                  <Link href="/app/perfil" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/carteira" className="flex items-center cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Carteira
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/minhas-avaliacoes" className="flex items-center cursor-pointer">
                    <Star className="mr-2 h-4 w-4" />
                    Minhas Avaliações
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

      {/* Modal de Notificação */}
      <NotificationModal
        open={showModal}
        onClose={() => setShowModal(false)}
        notification={newNotification}
      />
    </>
  )
}
