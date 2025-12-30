'use client'

import { Suspense, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/app/app-header'
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  ArrowRight,
  Loader2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Parceiro {
  id: string
  nomeFantasia: string
  logo: string | null
  category?: string
  rating?: number
  totalAvaliacoes?: number
  city?: { name: string } | null
  categoryRef?: { name: string } | null
  desconto?: string | null
  endereco?: string | null
  isDestaque?: boolean
}

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  count?: number
}

interface PageData {
  data: Parceiro[]
  categories: Category[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function ParceirosContent() {
  const searchParams = useSearchParams()
  const isFirstRender = useRef(true)
  const lastFetchParams = useRef('')

  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [categoria, setCategoria] = useState(searchParams.get('categoria') || '')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch parceiros
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoria) params.set('categoria', categoria)

    const paramsString = params.toString()

    if (paramsString === lastFetchParams.current && !isFirstRender.current) {
      return
    }

    lastFetchParams.current = paramsString
    isFirstRender.current = false

    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/app/parceiros?${paramsString}`)
        const json = await res.json()
        setData(json)
      } catch (error) {
        console.error('Erro ao buscar parceiros:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [search, categoria])

  // Atualizar URL
  useEffect(() => {
    if (isFirstRender.current) return

    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoria) params.set('categoria', categoria)

    const newUrl = params.toString()
      ? `/app/parceiros?${params.toString()}`
      : '/app/parceiros'

    window.history.replaceState(null, '', newUrl)
  }, [search, categoria])

  const handleClearFilters = useCallback(() => {
    setSearch('')
    setCategoria('')
  }, [])

  // Separar parceiros em destaque e normais
  const { destaques, outros } = useMemo(() => {
    if (!data?.data) return { destaques: [], outros: [] }
    return {
      destaques: data.data.filter(p => p.isDestaque),
      outros: data.data.filter(p => !p.isDestaque)
    }
  }, [data?.data])

  const getTitle = () => {
    if (search) return `Resultados para "${search}"`
    if (categoria && data?.categories) {
      const cat = data.categories.find(c => c.id === categoria)
      return cat?.name || 'Parceiros'
    }
    return 'Todos os Parceiros'
  }

  return (
    <div className="min-h-screen">
      <AppHeader showLocation={false} />

      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Parceiros</h1>
          <p className="text-slate-500">Encontre descontos exclusivos</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar parceiro..."
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all",
              showFilters ? "bg-brand-100 text-brand-600" : "text-slate-400 hover:bg-slate-100"
            )}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        {showFilters && data?.categories && data.categories.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">Filtrar por categoria</p>
              {categoria && (
                <button
                  onClick={() => setCategoria('')}
                  className="text-sm text-brand-600 font-medium"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {data.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoria(categoria === cat.id ? '' : cat.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    categoria === cat.id
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {data?.pagination?.total || 0} parceiro{(data?.pagination?.total || 0) !== 1 ? 's' : ''} encontrado{(data?.pagination?.total || 0) !== 1 ? 's' : ''}
          </p>
          {(search || categoria) && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-brand-600 font-medium flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Limpar
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        )}

        {/* Empty State */}
        {!loading && (!data?.data || data.data.length === 0) && (
          <div className="py-12 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum parceiro encontrado</p>
            <p className="text-sm text-slate-400 mt-1">Tente buscar por outro termo</p>
          </div>
        )}

        {/* Destaques */}
        {!loading && destaques.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              Em Destaque
            </h2>
            <div className="space-y-3">
              {destaques.map((parceiro) => (
                <ParceiroCard key={parceiro.id} parceiro={parceiro} />
              ))}
            </div>
          </section>
        )}

        {/* Todos os Parceiros */}
        {!loading && outros.length > 0 && (
          <section>
            {destaques.length > 0 && (
              <h2 className="text-lg font-bold text-slate-900 mb-3">Todos os Parceiros</h2>
            )}
            <div className="space-y-3">
              {outros.map((parceiro) => (
                <ParceiroCard key={parceiro.id} parceiro={parceiro} />
              ))}
            </div>
          </section>
        )}

        {/* Paginação */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <p className="text-center text-sm text-slate-500 mt-4">
            Página {data.pagination.page} de {data.pagination.totalPages}
          </p>
        )}
      </div>
    </div>
  )
}

function ParceiroCard({ parceiro }: { parceiro: Parceiro }) {
  return (
    <Link
      href={`/app/parceiros/${parceiro.id}`}
      className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-brand-200 transition-all"
    >
      <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
        {parceiro.logo ? (
          <img src={parceiro.logo} alt="" className="w-16 h-16 object-cover" />
        ) : (
          <span className="text-2xl font-bold text-slate-300">
            {parceiro.nomeFantasia?.charAt(0)}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900 truncate">{parceiro.nomeFantasia}</h3>
          {parceiro.isDestaque && (
            <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
          )}
        </div>
        {(parceiro.categoryRef?.name || parceiro.category) && (
          <p className="text-sm text-slate-500">{parceiro.categoryRef?.name || parceiro.category}</p>
        )}
        {parceiro.endereco && (
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{parceiro.endereco}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        {parceiro.desconto && (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
            {parceiro.desconto}
          </span>
        )}
        {parceiro.rating && parceiro.rating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-xs text-slate-600">{parceiro.rating.toFixed(1)}</span>
          </div>
        )}
        <ArrowRight className="w-5 h-5 text-slate-400" />
      </div>
    </Link>
  )
}

export default function ParceirosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      }
    >
      <ParceirosContent />
    </Suspense>
  )
}
