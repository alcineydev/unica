'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import {
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut
} from 'lucide-react'

export function AdminHeader() {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-6 sticky top-0 z-30">
      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all relative"
            aria-label="Abrir notificações"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900">Notificações</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <div className="p-4 text-center text-sm text-slate-500">
                    Nenhuma notificação nova
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 transition-all"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {session?.user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-900 truncate max-w-[120px]">
                {session?.user?.name || 'Administrador'}
              </p>
              <p className="text-xs text-slate-500">Admin</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                <div className="p-2">
                  <Link
                    href="/admin/perfil"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-700 hover:bg-slate-100 transition-all"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    Meu Perfil
                  </Link>
                  <Link
                    href="/admin/configuracoes"
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
