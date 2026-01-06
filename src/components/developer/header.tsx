'use client'

import { useSession } from 'next-auth/react'
import { Bell, Search } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function DeveloperHeader() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Spacer for mobile menu button */}
        <div className="w-10 lg:hidden" />

        {/* Search - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <Link href="/developer/conta/email" className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 transition-all">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0)?.toUpperCase() || 'D'}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-900">
                {session?.user?.name || 'Developer'}
              </p>
              <p className="text-xs text-slate-500">Developer</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
