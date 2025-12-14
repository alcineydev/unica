'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/user-avatar'
import { 
  Star, 
  Loader2,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Avaliacao {
  id: string
  rating: number
  comment?: string
  userName: string
  userAvatar?: string
  createdAt: string
}

export default function ParceiroAvaliacoesPage() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [stats, setStats] = useState({ media: 0, total: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAvaliacoes()
  }, [])

  const fetchAvaliacoes = async () => {
    try {
      const response = await fetch('/api/parceiro/avaliacoes')
      const data = await response.json()
      
      if (data.avaliacoes) {
        setAvaliacoes(data.avaliacoes)
        setStats(data.stats || { media: 0, total: 0 })
      }
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            )}
          />
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Avaliações</h1>
        <p className="text-sm text-muted-foreground">
          O que os clientes dizem sobre você
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-yellow-100">
                <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avaliação Média</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">{stats.media.toFixed(1)}</p>
                  {renderStars(Math.round(stats.media))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-blue-100">
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Avaliações</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Avaliações */}
      {avaliacoes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma avaliação recebida ainda
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {avaliacoes.map((avaliacao) => (
            <Card key={avaliacao.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <UserAvatar
                    src={avaliacao.userAvatar}
                    name={avaliacao.userName}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium truncate">{avaliacao.userName}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDate(avaliacao.createdAt)}
                      </span>
                    </div>
                    {renderStars(avaliacao.rating)}
                    {avaliacao.comment && (
                      <p className="text-sm text-muted-foreground mt-2">
                        &quot;{avaliacao.comment}&quot;
                      </p>
                    )}
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

