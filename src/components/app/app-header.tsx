'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Bell, MapPin } from 'lucide-react'
import { NotificationModal } from './notification-modal'

interface AppHeaderProps {
  showLocation?: boolean
}

interface NewNotification {
  title: string
  message: string
  type: string
  link?: string
}

export function AppHeader({ showLocation = true }: AppHeaderProps) {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState(0)
  const [lastCount, setLastCount] = useState(0)
  const isFirstRender = useRef(true)
  const [showModal, setShowModal] = useState(false)
  const [newNotification, setNewNotification] = useState<NewNotification | null>(null)

  const firstName = session?.user?.name?.split(' ')[0] || 'Olá'

  // Polling de notificações
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/app/notifications/count')
        const data = await response.json()
        const newCount = data.count || 0

        if (!isFirstRender.current && newCount > lastCount) {
          try {
            const notifResponse = await fetch('/api/app/notifications?limit=1')
            const notifData = await notifResponse.json()

            if (notifData.notifications && notifData.notifications.length > 0) {
              const lastNotif = notifData.notifications[0]
              let link = undefined

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
        setNotifications(newCount)
        isFirstRender.current = false
      } catch (error) {
        // Silently fail
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [lastCount])

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left - Greeting */}
            <div>
              <p className="text-sm text-slate-500">Olá, {firstName}!</p>
              {showLocation && (
                <button className="flex items-center gap-1 text-slate-900 font-medium mt-0.5">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  <span className="text-sm">Sinop, MT</span>
                </button>
              )}
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/app/notificacoes"
                className="relative p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
              >
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {notifications > 9 ? '9+' : notifications}
                  </span>
                )}
              </Link>
              <Link
                href="/app/perfil"
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/25"
              >
                {session?.user?.image ? (
                  <img src={session.user.image} alt="" className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <span className="text-white font-semibold">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </span>
                )}
              </Link>
            </div>
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
