'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, User, CreditCard, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useNotifications } from '@/providers/notifications-provider'
import { NotificationModal } from './notification-modal'

interface NewNotification {
  title: string
  message: string
  type: string
  link?: string
}

export function AppHeader() {
  const { data: session } = useSession()
  const router = useRouter()
  const { unreadCount } = useNotifications()

  // Modal de notificação in-app (removido - não usado)
  const [showModal, setShowModal] = useState(false)
  const [newNotification, setNewNotification] = useState<NewNotification | null>(null)



  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any
  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuário'
  const displayAvatar = user?.avatar || user?.image || ''
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <>
      <header className="hidden sticky top-0 z-40 bg-white border-b border-gray-200 h-14">
        <div className="flex items-center justify-between h-full px-4">
          {/* Logo */}
          <Link href="/app" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm shadow-blue-200/60">
              <span className="text-white font-extrabold text-xs">U</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-[15px] leading-none tracking-tight text-gray-900">UNICA</span>
              <span className="text-[9px] text-gray-400 block leading-tight">Assinante</span>
            </div>
          </Link>

          {/* Ações */}
          <div className="flex items-center gap-2">
            {/* Notificações */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={() => router.push('/app/notificacoes')}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>

            {/* Avatar + Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 rounded-full hover:bg-gray-100">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={displayAvatar} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {displayName.split(' ')[0]}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
                <DropdownMenuItem onClick={() => router.push('/app/perfil')} className="gap-2 cursor-pointer">
                  <User className="h-4 w-4" /> Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/app/carteira')} className="gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" /> Carteira
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="gap-2 cursor-pointer text-red-500 focus:text-red-500"
                >
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Modal de Notificação In-App */}
      <NotificationModal
        open={showModal}
        onClose={() => setShowModal(false)}
        notification={newNotification}
      />
    </>
  )
}
