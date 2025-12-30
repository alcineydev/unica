'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import {
  Bell,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  QrCode
} from 'lucide-react'

export function ParceiroHeader() {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-md ml-12 lg:ml-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            style={{
              backgroundColor: '#f8fafc',
              borderColor: 'rgb(226, 232, 240)'
            }}
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Quick Action - Scan QR */}
        <Link
          href="/parceiro/vendas"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all"
        >
          <QrCode className="w-4 h-4" />
          Registrar Venda
        </Link>

        {/* Notifications */}
        <button className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 transition-all"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {session?.user?.name?.charAt(0) || 'P'}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-900 truncate max-w-[120px]">
                {session?.user?.name || 'Parceiro'}
              </p>
              <p className="text-xs text-slate-500">Parceiro</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div
                className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden"
                style={{
                  backgroundColor: 'white',
                  borderColor: 'rgb(226, 232, 240)'
                }}
              >
                <div className="p-2">
                  <Link
                    href="/parceiro/perfil"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-700 hover:bg-slate-100 transition-all"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    Minha Empresa
                  </Link>
                  <Link
                    href="/parceiro/configuracoes"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-700 hover:bg-slate-100 transition-all"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Configurações
                  </Link>
                  <hr className="my-2 border-slate-100" />
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
