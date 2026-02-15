'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Bell, ChevronRight, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

export function NotificationBell({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      // Buscar count
      const countRes = await fetch('/api/app/notifications/count')
      if (countRes.ok) {
        const countData = await countRes.json()
        setUnreadCount(countData.count || 0)
      }

      // Buscar últimas 3
      const res = await fetch('/api/app/notifications?limit=3')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch {
      // silencioso
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CASHBACK': return '💰'
      case 'PROMOCAO': return '🎉'
      case 'SISTEMA': return '⚙️'
      case 'PARCEIRO': return '🏪'
      default: return '🔔'
    }
  }

  const isDark = variant === 'dark'

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-all ${
          isDark
            ? 'text-white/40 hover:text-white/70 hover:bg-white/5'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`fixed right-4 top-16 lg:absolute lg:right-0 lg:top-full lg:mt-2 w-80 rounded-2xl shadow-2xl border z-[9999] ${
          isDark
            ? 'bg-[#0d1b36] border-white/10'
            : 'bg-white border-gray-200'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${
            isDark ? 'border-white/[0.06]' : 'border-gray-100'
          }`}>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Notificações
              </h3>
              {unreadCount > 0 && (
                <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              title="Fechar notificações"
              className={`p-1 rounded-lg transition-colors ${
                isDark ? 'text-white/30 hover:text-white/60 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Notificações */}
          <div className="max-h-[240px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.slice(0, 3).map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                    isDark
                      ? `hover:bg-white/[0.04] ${!notif.read ? 'bg-blue-500/[0.06]' : ''}`
                      : `hover:bg-gray-50 ${!notif.read ? 'bg-blue-50/50' : ''}`
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm ${
                    isDark ? 'bg-white/[0.06]' : 'bg-gray-100'
                  }`}>
                    {getTypeIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${
                      isDark ? 'text-white/80' : 'text-gray-900'
                    }`}>
                      {notif.title}
                    </p>
                    <p className={`text-[11px] line-clamp-2 mt-0.5 ${
                      isDark ? 'text-white/30' : 'text-gray-500'
                    }`}>
                      {notif.message}
                    </p>
                    <p className={`text-[9px] mt-1 ${
                      isDark ? 'text-white/20' : 'text-gray-300'
                    }`}>
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <Bell className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-white/10' : 'text-gray-200'}`} />
                <p className={`text-xs ${isDark ? 'text-white/20' : 'text-gray-400'}`}>
                  Nenhuma notificação
                </p>
              </div>
            )}
          </div>

          {/* Footer — Ver todas */}
          <Link
            href="/app/notificacoes"
            onClick={() => setIsOpen(false)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 border-t text-xs font-semibold transition-colors ${
              isDark
                ? 'border-white/[0.06] text-blue-400 hover:bg-white/[0.04]'
                : 'border-gray-100 text-blue-600 hover:bg-gray-50'
            }`}
          >
            Ver todas <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
