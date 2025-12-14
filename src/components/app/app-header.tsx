'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Sparkles, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/user-avatar'

export function AppHeader() {
  const { data: session } = useSession()

  const user = session?.user
  const firstName = user?.name?.split(' ')[0] || 'Usuário'

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/app" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Unica</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              2
            </span>
          </Button>
          <Link href="/app/perfil">
            <UserAvatar 
              src={user?.avatar} 
              name={user?.name} 
              size="sm"
            />
          </Link>
        </div>
      </div>
      <div className="px-4 pb-3">
        <p className="text-sm text-muted-foreground">Olá,</p>
        <p className="text-lg font-semibold">{firstName}!</p>
      </div>
    </header>
  )
}

