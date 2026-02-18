'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bell, CheckCheck, Star, ShoppingCart, Gift, Info, ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Notificacao {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  data?: string
  createdAt: string
}

const ICON_MAP: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  AVALIACAO: { icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
  VENDA: { icon: ShoppingCart, color: 'text-green-600', bg: 'bg-green-50' },
  COMPRA: { icon: ShoppingCart, color: 'text-green-600', bg: 'bg-green-50' },
  PONTOS: { icon: Gift, color: 'text-violet-600', bg: 'bg-violet-50' },
  CASHBACK: { icon: Gift, color: 'text-violet-600', bg: 'bg-violet-50' },
  DEFAULT: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
}

function formatDate(dateString: string) {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR })
  } catch {
    return ''
  }
}

export default function NotificacoesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotificacoes = useCallback(async () => {
    try {
      const response = await fetch('/api/app/notifications')
      const data = await response.json()
      if (data.notifications) setNotificacoes(data.notifications)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    fetchNotificacoes()
  }, [pathname, fetchNotificacoes])

  const marcarComoLida = async (id: string) => {
    try {
      await fetch(`/api/app/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      })
      setNotificacoes(prev => prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      ))
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }

  const marcarTodasComoLidas = async () => {
    try {
      await fetch('/api/app/notifications/read-all', { method: 'POST' })
      setNotificacoes(prev => prev.map(n => ({ ...n, read: true })))
      toast.success('Todas marcadas como lidas')
    } catch {
      toast.error('Erro ao marcar notificações')
    }
  }

  const handleClick = (notificacao: Notificacao) => {
    if (!notificacao.read) marcarComoLida(notificacao.id)
    if (notificacao.data) {
      try {
        const data = JSON.parse(notificacao.data)
        if (data.link) {
          router.push(data.link)
          return
        }
        if (data.parceiroId && notificacao.type === 'AVALIACAO') {
          router.push(`/app/avaliar/${data.parceiroId}`)
          return
        }
      } catch {
        /* ignore parse error */
      }
    }
  }

  const naoLidas = notificacoes.filter(n => !n.read).length

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2 mt-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="pb-24 px-4 pt-4 lg:px-10 lg:pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notificações</h1>
          <p className="text-sm text-gray-400">
            {naoLidas > 0 ? `${naoLidas} não lida${naoLidas > 1 ? 's' : ''}` : 'Todas lidas'}
          </p>
        </div>
        {naoLidas > 0 && (
          <button
            onClick={marcarTodasComoLidas}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
          </button>
        )}
      </div>

      {/* Lista */}
      {notificacoes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell className="h-7 w-7 text-gray-200" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Nenhuma notificação</h3>
          <p className="text-sm text-gray-400">Você será notificado sobre compras, pontos e promoções</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notificacoes.map((notif) => {
            const iconConfig = ICON_MAP[notif.type] || ICON_MAP.DEFAULT
            const Icon = iconConfig.icon
            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl transition-all ${!notif.read
                    ? 'bg-blue-50/60 border border-blue-100 hover:bg-blue-50'
                    : 'bg-white border border-gray-100 hover:bg-gray-50 opacity-75'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl ${iconConfig.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className={`h-4 w-4 ${iconConfig.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{notif.title}</h3>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-[10px] text-gray-300 mt-1.5">{formatDate(notif.createdAt)}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-1" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
