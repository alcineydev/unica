'use client'

import { Suspense, useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { SearchInput } from '@/components/app/parceiros/search-input'
import { CategoryFilter } from '@/components/app/parceiros/category-filter'
import { ParceiroCardGrid } from '@/components/app/home/parceiro-card-grid'

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

  // Fetch parceiros - apenas quando search ou categoria mudar
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoria) params.set('categoria', categoria)

    const paramsString = params.toString()

    // Evitar fetch duplicado com mesmos parâmetros
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

  // Atualizar URL - separado do fetch, sem causar re-render
  useEffect(() => {
    if (isFirstRender.current) return

    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoria) params.set('categoria', categoria)

    const newUrl = params.toString()
      ? `/app/parceiros?${params.toString()}`
      : '/app/parceiros'

    // Usar window.history para não causar re-render
    window.history.replaceState(null, '', newUrl)
  }, [search, categoria])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
  }, [])

  const handleCategorySelect = useCallback((id: string | null) => {
    setCategoria(id || '')
  }, [])

  // Get page title
  const getTitle = () => {
    if (search) return `Resultados para "${search}"`
    if (categoria && data?.categories) {
      const cat = data.categories.find(c => c.id === categoria)
      return cat?.name || 'Parceiros'
    }
    return 'Todos os Parceiros'
  }

  const handleClearFilters = useCallback(() => {
    setSearch('')
    setCategoria('')
  }, [])

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Header com busca */}
      <div className="sticky top-0 z-10 bg-[#f8fafc] border-b">
        <div className="px-4 py-3">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar parceiros..."
          />
        </div>

        {/* Filtro de categorias */}
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
        {/* Título e contagem */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold">{getTitle()}</h1>
          <span className="text-sm text-gray-500">
            {data?.pagination?.total || 0} parceiro{(data?.pagination?.total || 0) !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Lista vazia */}
        {!loading && (!data?.data || data.data.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Nenhum parceiro encontrado
            </p>
            {(search || categoria) && (
              <button
                onClick={handleClearFilters}
                className="mt-2 text-blue-600 text-sm underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Grid de parceiros */}
        {!loading && data?.data && data.data.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.data.map(parceiro => (
              <ParceiroCardGrid key={parceiro.id} parceiro={parceiro} />
            ))}
          </div>
        )}

        {/* Paginação */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="text-center text-sm text-gray-500 mt-4">
            Página {data.pagination.page} de {data.pagination.totalPages}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ParceirosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ParceirosContent />
    </Suspense>
  )
}
