'use client'

import { Suspense, useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, Building2, Star, Search, X } from 'lucide-react'
import { SearchInput } from '@/components/app/parceiros/search-input'
import { CategoryFilter } from '@/components/app/parceiros/category-filter'

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

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoria) params.set('categoria', categoria)

    const paramsString = params.toString()
    if (paramsString === lastFetchParams.current && !isFirstRender.current) return

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

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
  }, [])

  const handleCategorySelect = useCallback((id: string | null) => {
    setCategoria(id || '')
  }, [])

  const handleClearFilters = useCallback(() => {
    setSearch('')
    setCategoria('')
  }, [])

  const getTitle = () => {
    if (search) return `Resultados para "${search}"`
    if (categoria && data?.categories) {
      const cat = data.categories.find(c => c.id === categoria)
      return cat?.name || 'Parceiros'
    }
    return 'Todos os Parceiros'
  }

  const hasFilters = search || categoria

  return (
    <div className="pb-24">
      {/* Header com busca */}
      <div className="sticky top-0 z-10 bg-[#f8fafc]/95 backdrop-blur-sm border-b border-gray-100">
        <div className="px-4 py-3">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar parceiros..."
          />
        </div>

        {data?.categories && data.categories.length > 0 && (
          <div className="px-4 pb-3">
            <CategoryFilter
              categories={data.categories}
              selected={categoria || null}
              onChange={handleCategorySelect}
            />
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="px-4 py-4">
        {/* Título + contagem + limpar filtros */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{getTitle()}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {data?.pagination?.total || 0} parceiro{(data?.pagination?.total || 0) !== 1 ? 's' : ''} encontrado{(data?.pagination?.total || 0) !== 1 ? 's' : ''}
            </p>
          </div>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-white rounded-xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* Lista vazia */}
        {!loading && (!data?.data || data.data.length === 0) && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="h-7 w-7 text-gray-200" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Nenhum parceiro encontrado</h3>
            <p className="text-sm text-gray-400 mb-4">Tente buscar com outros termos</p>
            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Lista de parceiros */}
        {!loading && data?.data && data.data.length > 0 && (
          <div className="space-y-2.5">
            {data.data.map(parceiro => (
              <Link key={parceiro.id} href={`/app/parceiros/${parceiro.id}`}>
                <div className="flex items-center gap-3.5 p-3 bg-white rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-sm transition-all active:scale-[0.99]">
                  {/* Logo */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                    {parceiro.logo ? (
                      <Image src={parceiro.logo} alt={parceiro.nomeFantasia} width={48} height={48} className="object-cover w-full h-full" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                        <Building2 className="h-5 w-5 text-blue-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-gray-900 truncate">{parceiro.nomeFantasia}</p>
                      {(parceiro.rating ?? 0) > 0 && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-[11px] font-medium text-gray-500">{parceiro.rating?.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">
                      {parceiro.categoryRef?.name || parceiro.category || ''}
                      {parceiro.city && <> · {parceiro.city.name}</>}
                    </p>
                    {parceiro.desconto && (
                      <span className="inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                        {parceiro.desconto}
                      </span>
                    )}
                  </div>

                  {/* Seta */}
                  <svg className="h-4 w-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Paginação */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Página {data.pagination.page} de {data.pagination.totalPages}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ParceirosPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <ParceirosContent />
    </Suspense>
  )
}
