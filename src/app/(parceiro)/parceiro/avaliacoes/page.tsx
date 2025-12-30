'use client'

import { useState, useEffect } from 'react'
import {
  Star,
  Loader2,
  MessageSquare,
  Eye,
  EyeOff,
  TrendingUp,
  ChevronDown,
  Reply,
  Send,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { StatsCard } from '@/components/parceiro/stats-card'

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

type FiltroOption = 'todas' | 'publicadas' | 'nao-publicadas'
type OrdenarOption = 'recente' | 'antiga' | 'maior' | 'menor'

const filtroLabels: Record<FiltroOption, string> = {
  'todas': 'Todas',
  'publicadas': 'Publicadas',
  'nao-publicadas': 'Não Publicadas'
}

const ordenarLabels: Record<OrdenarOption, string> = {
  'recente': 'Mais Recentes',
  'antiga': 'Mais Antigas',
  'maior': 'Maior Nota',
  'menor': 'Menor Nota'
}

export default function AvaliacoesPage() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filtro, setFiltro] = useState<FiltroOption>('todas')
  const [ordenar, setOrdenar] = useState<OrdenarOption>('recente')
  const [showFiltroDropdown, setShowFiltroDropdown] = useState(false)
  const [showOrdenarDropdown, setShowOrdenarDropdown] = useState(false)

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
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-200 text-slate-200'
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-500">Carregando avaliações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Avaliações</h1>
        <p className="text-slate-500">Veja o que os clientes estão dizendo</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Média"
          value={(estatisticas?.media || 0).toFixed(1)}
          icon={Star}
          color="amber"
        />
        <StatsCard
          title="Total"
          value={estatisticas?.total || 0}
          icon={MessageSquare}
          color="blue"
        />
        <StatsCard
          title="Publicadas"
          value={estatisticas?.publicadas || 0}
          icon={Eye}
          color="emerald"
        />
        <StatsCard
          title="Positivas"
          value={`${estatisticas?.total ? Math.round((estatisticas.distribuicao[5] + estatisticas.distribuicao[4]) / estatisticas.total * 100) : 0}%`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Distribuição de Notas */}
      {estatisticas && estatisticas.total > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Distribuição de Notas</h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((nota) => {
              const count = estatisticas.distribuicao[nota as keyof typeof estatisticas.distribuicao]
              const percent = estatisticas.total > 0 ? (count / estatisticas.total) * 100 : 0
              return (
                <div key={nota} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium text-slate-700">{nota}</span>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-500 w-10 text-right">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filtro */}
          <div className="relative">
            <button
              onClick={() => {
                setShowFiltroDropdown(!showFiltroDropdown)
                setShowOrdenarDropdown(false)
              }}
              className="w-full sm:w-[180px] flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm hover:bg-slate-100 transition-colors"
            >
              <span className="text-slate-700">{filtroLabels[filtro]}</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {showFiltroDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFiltroDropdown(false)} />
                <div className="absolute left-0 top-full mt-2 w-full sm:w-[180px] bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
                  {(Object.entries(filtroLabels) as [FiltroOption, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => {
                        setFiltro(value)
                        setShowFiltroDropdown(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
                        filtro === value ? 'text-emerald-600 bg-emerald-50' : 'text-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Ordenar */}
          <div className="relative">
            <button
              onClick={() => {
                setShowOrdenarDropdown(!showOrdenarDropdown)
                setShowFiltroDropdown(false)
              }}
              className="w-full sm:w-[180px] flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm hover:bg-slate-100 transition-colors"
            >
              <span className="text-slate-700">{ordenarLabels[ordenar]}</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {showOrdenarDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowOrdenarDropdown(false)} />
                <div className="absolute left-0 top-full mt-2 w-full sm:w-[180px] bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
                  {(Object.entries(ordenarLabels) as [OrdenarOption, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => {
                        setOrdenar(value)
                        setShowOrdenarDropdown(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
                        ordenar === value ? 'text-emerald-600 bg-emerald-50' : 'text-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Avaliações */}
      {avaliacoes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <Star className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">Nenhuma avaliação ainda</h3>
          <p className="text-slate-500">
            As avaliações dos clientes aparecerão aqui
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {avaliacoes.map((avaliacao) => (
            <div
              key={avaliacao.id}
              className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 transition-all ${
                !avaliacao.publicada ? 'opacity-70' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Info do Cliente */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-600 font-semibold text-lg">
                      {avaliacao.assinante.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-slate-900">{avaliacao.assinante.nome}</span>
                      {renderStars(avaliacao.nota, 'sm')}
                    </div>
                    {avaliacao.comentario && (
                      <p className="text-sm text-slate-600 mt-2">
                        &quot;{avaliacao.comentario}&quot;
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {formatDate(avaliacao.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Status e Toggle */}
                <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    avaliacao.publicada
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {avaliacao.publicada ? (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        Pública
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        Oculta
                      </>
                    )}
                  </span>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-slate-500">Publicar</span>
                    <button
                      onClick={() => togglePublicacao(avaliacao.id, !avaliacao.publicada)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        avaliacao.publicada ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          avaliacao.publicada ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>

              {/* Resposta ou botão de responder */}
              {avaliacao.resposta ? (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-2">Sua resposta:</p>
                    <p className="text-sm text-slate-700">{avaliacao.resposta}</p>
                    {avaliacao.respondidoEm && (
                      <p className="text-xs text-slate-400 mt-2">
                        {formatDate(avaliacao.respondidoEm)}
                      </p>
                    )}
                  </div>
                </div>
              ) : respondendo === avaliacao.id ? (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <textarea
                    placeholder="Digite sua resposta..."
                    value={textoResposta}
                    onChange={(e) => setTextoResposta(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setRespondendo(null); setTextoResposta('') }}
                      className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                    <button
                      onClick={() => responderAvaliacao(avaliacao.id)}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Enviar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setRespondendo(avaliacao.id)}
                  className="mt-4 flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  <Reply className="h-4 w-4" />
                  Responder
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
