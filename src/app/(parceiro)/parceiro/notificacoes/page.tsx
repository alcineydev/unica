'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  Check,
  CheckCheck,
  ShoppingCart,
  Star,
  Users,
  Info,
  Loader2,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Notificacao {
  id: string
  tipo: 'venda' | 'avaliacao' | 'cliente' | 'info'
  titulo: string
  mensagem: string
  lida: boolean
  createdAt: string
}

export default function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNotificacoes()
  }, [])

  const fetchNotificacoes = async () => {
    try {
      const response = await fetch('/api/parceiro/notificacoes')
      const data = await response.json()

      if (data.notificacoes) {
        setNotificacoes(data.notificacoes)
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
      toast.error('Erro ao carregar notificações')
    } finally {
      setIsLoading(false)
    }
  }

  const marcarComoLida = async (id: string) => {
    try {
      await fetch(`/api/parceiro/notificacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lida: true })
      })

      setNotificacoes(prev =>
        prev.map(n => n.id === id ? { ...n, lida: true } : n)
      )
    } catch (error) {
      console.error('Erro ao marcar notificação:', error)
    }
  }

  const marcarTodasComoLidas = async () => {
    try {
      await fetch('/api/parceiro/notificacoes/marcar-todas', {
        method: 'POST'
      })

      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
      toast.success('Todas as notificações foram marcadas como lidas')
    } catch (error) {
      console.error('Erro ao marcar notificações:', error)
      toast.error('Erro ao marcar notificações')
    }
  }

  const getIcone = (tipo: string) => {
    switch (tipo) {
      case 'venda':
        return <ShoppingCart className="h-5 w-5 text-green-600" />
      case 'avaliacao':
        return <Star className="h-5 w-5 text-yellow-500" />
      case 'cliente':
        return <Users className="h-5 w-5 text-blue-600" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const naoLidas = notificacoes.filter(n => !n.lida).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notificações
          </h1>
          <p className="text-muted-foreground">
            {naoLidas > 0
              ? `Você tem ${naoLidas} notificação${naoLidas > 1 ? 'ões' : ''} não lida${naoLidas > 1 ? 's' : ''}`
              : 'Todas as notificações foram lidas'
            }
          </p>
        </div>
        {naoLidas > 0 && (
          <Button variant="outline" onClick={marcarTodasComoLidas} size="sm">
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Lista de Notificações */}
      {notificacoes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Nenhuma notificação</h3>
            <p className="text-muted-foreground">
              Você será notificado sobre vendas, avaliações e novos clientes aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notificacoes.map((notificacao) => (
            <Card
              key={notificacao.id}
              className={`transition-colors ${!notificacao.lida ? 'bg-primary/5 border-primary/20' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`p-2 rounded-full ${!notificacao.lida ? 'bg-primary/10' : 'bg-muted'}`}>
                      {getIcone(notificacao.tipo)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-sm sm:text-base">
                          {notificacao.titulo}
                          {!notificacao.lida && (
                            <Badge variant="default" className="ml-2 text-[10px]">
                              Nova
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notificacao.mensagem}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notificacao.createdAt), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                      {!notificacao.lida && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => marcarComoLida(notificacao.id)}
                          className="flex-shrink-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
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
