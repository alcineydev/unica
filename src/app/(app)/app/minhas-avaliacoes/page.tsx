'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Star,
  Loader2,
  MessageSquare
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Avaliacao {
  id: string
  nota: number
  comentario?: string
  createdAt: string
  parceiro: {
    id: string
    nome: string
    logo?: string
  }
}

export default function MinhasAvaliacoesPage() {
  const pathname = usePathname()
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAvaliacoes = useCallback(async () => {
    try {
      const response = await fetch('/api/app/avaliacoes')
      const data = await response.json()

      if (data.avaliacoes) {
        setAvaliacoes(data.avaliacoes)
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    fetchAvaliacoes()
  }, [pathname, fetchAvaliacoes])

  const renderStars = (nota: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= nota
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
              }`}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch {
      return ''
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:px-10 lg:pt-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Minhas Avaliações</h1>
        <p className="text-gray-500">Histórico das suas avaliações</p>
      </div>

      {/* Lista */}
      {avaliacoes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-500 mb-4" />
            <h3 className="font-semibold mb-2">Nenhuma avaliação</h3>
            <p className="text-gray-500">
              Suas avaliações aparecerão aqui após você avaliar um parceiro
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {avaliacoes.map((avaliacao) => (
            <Card key={avaliacao.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={avaliacao.parceiro.logo} />
                    <AvatarFallback className="bg-blue-50 text-blue-600">
                      {avaliacao.parceiro.nome.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{avaliacao.parceiro.nome}</h3>
                      {renderStars(avaliacao.nota)}
                    </div>
                    {avaliacao.comentario && (
                      <p className="text-sm text-gray-500 mt-1">
                        &quot;{avaliacao.comentario}&quot;
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(avaliacao.createdAt)}
                    </p>
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
