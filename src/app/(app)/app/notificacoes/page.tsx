'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Bell, CheckCircle, Gift, Crown, Megaphone } from 'lucide-react'
import { toast } from 'sonner'

interface Notificacao {
  id: string
  titulo: string
  mensagem: string
  tipo: 'INFO' | 'PROMOCAO' | 'SISTEMA' | 'BENEFICIO'
  lida: boolean
  criadoEm: string
  linkUrl?: string
}

export default function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNotificacoes()
  }, [])

  const fetchNotificacoes = async () => {
    try {
      const response = await fetch('/api/app/notifications')
      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      setNotificacoes(data.notificacoes || [])
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      // Not showing error toast for now since the API might not exist yet
    } finally {
      setIsLoading(false)
    }
  }

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'PROMOCAO':
        return <Gift className="h-5 w-5 text-green-500" />
      case 'BENEFICIO':
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 'SISTEMA':
        return <Megaphone className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5 text-primary" />
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 60) return `${minutes}min atrás`
    if (hours < 24) return `${hours}h atrás`
    if (days < 7) return `${days}d atrás`
    return d.toLocaleDateString('pt-BR')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notificações</h1>
        <p className="text-muted-foreground">Suas atualizações e avisos</p>
      </div>

      {notificacoes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Nenhuma notificação</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Você ainda não tem notificações. Quando houver novidades, elas aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notificacoes.map((notif) => (
            <Card
              key={notif.id}
              className={`transition-all ${!notif.lida ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notif.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{notif.titulo}</h3>
                      {!notif.lida && (
                        <Badge variant="default" className="text-xs">Nova</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notif.mensagem}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      {notif.lida && <CheckCircle className="h-3 w-3" />}
                      <span>{formatDate(notif.criadoEm)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
