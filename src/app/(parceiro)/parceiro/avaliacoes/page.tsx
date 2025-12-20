'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Star,
  Loader2,
  MessageSquare,
  Eye,
  EyeOff,
  TrendingUp,
  Filter,
  Reply
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Avaliacao {
  id: string
  nota: number
  comentario?: string
  resposta?: string
  respondidoEm?: string
  publicada: boolean
  createdAt: string
  assinante: {
    id: string
    nome: string
    avatar?: string
  }
}

interface Estatisticas {
  total: number
  media: number
  publicadas: number
  distribuicao: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

export default function AvaliacoesPage() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filtro, setFiltro] = useState('todas')
  const [ordenar, setOrdenar] = useState('recente')

  // Estados para resposta
  const [respondendo, setRespondendo] = useState<string | null>(null)
  const [textoResposta, setTextoResposta] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchAvaliacoes()
  }, [filtro, ordenar])

  const fetchAvaliacoes = async () => {
    try {
      const response = await fetch(`/api/parceiro/avaliacoes?filtro=${filtro}&ordenar=${ordenar}`)
      const data = await response.json()

      if (data.avaliacoes) {
        setAvaliacoes(data.avaliacoes)
        setEstatisticas(data.estatisticas)
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error)
      toast.error('Erro ao carregar avaliações')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePublicacao = async (id: string, publicada: boolean) => {
    try {
      const response = await fetch(`/api/parceiro/avaliacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicada })
      })

      if (response.ok) {
        setAvaliacoes(prev => prev.map(a =>
          a.id === id ? { ...a, publicada } : a
        ))
        toast.success(publicada ? 'Avaliação publicada!' : 'Avaliação ocultada')
      }
    } catch (error) {
      toast.error('Erro ao atualizar avaliação')
    }
  }

  const responderAvaliacao = async (id: string) => {
    if (!textoResposta.trim()) {
      toast.error('Digite uma resposta')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/parceiro/avaliacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resposta: textoResposta.trim() })
      })

      if (response.ok) {
        setAvaliacoes(prev => prev.map(a =>
          a.id === id ? { ...a, resposta: textoResposta.trim(), respondidoEm: new Date().toISOString() } : a
        ))
        toast.success('Resposta enviada!')
        setRespondendo(null)
        setTextoResposta('')
      }
    } catch (error) {
      toast.error('Erro ao enviar resposta')
    } finally {
      setIsSaving(false)
    }
  }

  const renderStars = (nota: number, size: 'sm' | 'md' = 'md') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= nota
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-zinc-200 text-zinc-200'
            }`}
          />
        ))}
      </div>
    )
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
      <div>
        <h1 className="text-2xl font-bold">Avaliações</h1>
        <p className="text-muted-foreground">Veja o que os clientes estão dizendo</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{estatisticas?.media || 0}</p>
                <p className="text-xs text-muted-foreground">Média</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{estatisticas?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{estatisticas?.publicadas || 0}</p>
                <p className="text-xs text-muted-foreground">Publicadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {estatisticas?.total ? Math.round((estatisticas.distribuicao[5] + estatisticas.distribuicao[4]) / estatisticas.total * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Positivas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de Notas */}
      {estatisticas && estatisticas.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Notas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[5, 4, 3, 2, 1].map((nota) => {
              const count = estatisticas.distribuicao[nota as keyof typeof estatisticas.distribuicao]
              const percent = estatisticas.total > 0 ? (count / estatisticas.total) * 100 : 0
              return (
                <div key={nota} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{nota}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <Progress value={percent} className="flex-1 h-2" />
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="publicadas">Publicadas</SelectItem>
                <SelectItem value="nao-publicadas">Não Publicadas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ordenar} onValueChange={setOrdenar}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recente">Mais Recentes</SelectItem>
                <SelectItem value="antiga">Mais Antigas</SelectItem>
                <SelectItem value="maior">Maior Nota</SelectItem>
                <SelectItem value="menor">Menor Nota</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Avaliações */}
      {avaliacoes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Nenhuma avaliação ainda</h3>
            <p className="text-muted-foreground">
              As avaliações dos clientes aparecerão aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {avaliacoes.map((avaliacao) => (
            <Card key={avaliacao.id} className={!avaliacao.publicada ? 'opacity-70' : ''}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Info do Cliente */}
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avaliacao.assinante.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {avaliacao.assinante.nome.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{avaliacao.assinante.nome}</span>
                        {renderStars(avaliacao.nota, 'sm')}
                      </div>
                      {avaliacao.comentario && (
                        <p className="text-sm text-muted-foreground mt-1">
                          &quot;{avaliacao.comentario}&quot;
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(avaliacao.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <div className="flex items-center gap-2">
                      {avaliacao.publicada ? (
                        <Badge variant="default" className="bg-green-600">
                          <Eye className="h-3 w-3 mr-1" />
                          Pública
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Oculta
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Publicar</span>
                      <Switch
                        checked={avaliacao.publicada}
                        onCheckedChange={(checked) => togglePublicacao(avaliacao.id, checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Resposta ou botão de responder */}
                {avaliacao.resposta ? (
                  <div className="mt-3 pt-3 border-t bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Sua resposta:</p>
                    <p className="text-sm">{avaliacao.resposta}</p>
                    {avaliacao.respondidoEm && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(avaliacao.respondidoEm)}
                      </p>
                    )}
                  </div>
                ) : respondendo === avaliacao.id ? (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <Textarea
                      placeholder="Digite sua resposta..."
                      value={textoResposta}
                      onChange={(e) => setTextoResposta(e.target.value)}
                      rows={3}
                      maxLength={500}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setRespondendo(null); setTextoResposta('') }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => responderAvaliacao(avaliacao.id)}
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar Resposta'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setRespondendo(avaliacao.id)}
                  >
                    <Reply className="h-4 w-4 mr-1" />
                    Responder
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
