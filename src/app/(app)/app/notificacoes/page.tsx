'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bell,
  CheckCheck,
  Star,
  ShoppingCart,
  Gift,
  Info,
  ChevronRight
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

export default function NotificacoesPage() {
  const router = useRouter()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNotificacoes()
  }, [])

  const fetchNotificacoes = async () => {
    try {
      const response = await fetch('/api/app/notifications')
      const data = await response.json()

      if (data.notifications) {
        setNotificacoes(data.notifications)
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
    } catch (error) {
      toast.error('Erro ao marcar notificações')
    }
  }

  const handleNotificacaoClick = (notificacao: Notificacao) => {
    // Marcar como lida
    if (!notificacao.read) {
      marcarComoLida(notificacao.id)
    }

    // Se tem dados com link, navegar
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
      } catch (e) {
        console.log('Erro ao parsear data:', e)
      }
    }
  }

  const getIcone = (type: string) => {
    switch (type) {
      case 'AVALIACAO':
        return <Star className="h-5 w-5 text-yellow-500" />
      case 'VENDA':
      case 'COMPRA':
        return <ShoppingCart className="h-5 w-5 text-green-600" />
      case 'PONTOS':
      case 'CASHBACK':
        return <Gift className="h-5 w-5 text-purple-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      })
    } catch {
      return ''
    }
  }

  const naoLidas = notificacoes.filter(n => !n.read).length

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-muted-foreground">Suas atualizações e avisos</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-muted-foreground">
            {naoLidas > 0 ? `${naoLidas} não lida${naoLidas > 1 ? 's' : ''}` : 'Todas lidas'}
          </p>
        </div>
        {naoLidas > 0 && (
          <Button variant="outline" size="sm" onClick={marcarTodasComoLidas}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas
          </Button>
        )}
      </div>

      {/* Lista */}
      {notificacoes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Nenhuma notificação</h3>
            <p className="text-muted-foreground">
              Você será notificado sobre compras, pontos e promoções
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notificacoes.map((notificacao) => (
            <Card
              key={notificacao.id}
              className={`cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                !notificacao.read ? 'border-primary/30 bg-primary/5' : 'opacity-70'
              }`}
              onClick={() => handleNotificacaoClick(notificacao)}
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcone(notificacao.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium">{notificacao.title}</h3>
                      {!notificacao.read && (
                        <Badge variant="default" className="flex-shrink-0 text-xs">
                          Nova
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notificacao.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(notificacao.createdAt)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 self-center" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
