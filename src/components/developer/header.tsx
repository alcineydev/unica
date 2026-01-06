'use client'

import { useSession } from 'next-auth/react'
import { Bell, Search, Terminal } from 'lucide-react'
import Link from 'next/link'

export function DeveloperHeader() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Spacer for mobile menu button */}
        <div className="w-10 lg:hidden" />

        {/* Search - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="buscar..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-sm text-slate-300 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-mono"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-800 hover:text-emerald-400 transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </button>

          <Link href="/developer/conta/email" className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-all group">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Terminal className="w-4 h-4 text-slate-900" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-300 group-hover:text-emerald-400 transition-colors font-mono">
                {session?.user?.name || 'developer'}
              </p>
              <p className="text-xs text-slate-500 font-mono">// root</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
