'use client'

import { useSession, signOut } from 'next-auth/react'
import { Shield, LogOut, User, Bell, Search } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function DeveloperHeader() {
  const { data: session } = useSession()

  const initials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'DE'

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 lg:px-6">
      {/* Left side - Title (hidden on mobile, shown as spacer for menu button) */}
      <div className="flex items-center gap-3 pl-14 lg:pl-0">
        <Shield className="h-5 w-5 text-red-500" />
        <span className="text-lg font-semibold text-white">Painel Developer</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search - desktop only */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar..."
            className="w-64 bg-zinc-900 border-zinc-700 pl-10 text-sm text-white placeholder:text-zinc-500 focus:border-red-500"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
          <Bell className="h-5 w-5" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20 text-sm font-medium text-red-400 ring-2 ring-red-500/30 transition-all hover:ring-red-500/50">
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-700">
            <DropdownMenuLabel className="text-zinc-300">
              <div className="flex flex-col">
                <span className="font-medium">{session?.user?.name || 'Developer'}</span>
                <span className="text-xs text-zinc-500">{session?.user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-700" />
            <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-700" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-red-400 focus:bg-red-500/20 focus:text-red-400 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
