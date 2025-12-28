'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { SearchInput, CategoryFilter } from '@/components/app/parceiros'
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

function ParceirosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

  // Get filter values from URL
  const search = searchParams.get('search') || ''
  const categoria = searchParams.get('categoria') || ''
  const destaque = searchParams.get('destaque') === 'true'
  const novidades = searchParams.get('novidades') === 'true'

  // Update URL with new params
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    router.push(`/app/parceiros?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  // Fetch parceiros
  const fetchParceiros = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoria) params.set('categoria', categoria)
      if (destaque) params.set('destaque', 'true')
      if (novidades) params.set('novidades', 'true')

      const res = await fetch(`/api/app/parceiros?${params.toString()}`)
      const data = await res.json()

      if (data.data) {
        setParceiros(data.data)
        setCategories(data.categories || [])
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 })
      }
    } catch (error) {
      console.error('Erro ao buscar parceiros:', error)
    } finally {
      setLoading(false)
    }
  }, [search, categoria, destaque, novidades])

  useEffect(() => {
    fetchParceiros()
  }, [fetchParceiros])

  // Handle search
  const handleSearch = useCallback((value: string) => {
    updateParams({ search: value || null })
  }, [updateParams])

  // Handle category change
  const handleCategoryChange = useCallback((categoryId: string | null) => {
    updateParams({ categoria: categoryId })
  }, [updateParams])

  // Get page title
  const getTitle = () => {
    if (search) return `Resultados para "${search}"`
    if (destaque) return 'Destaques'
    if (novidades) return 'Novidades'
    if (categoria) {
      const cat = categories.find(c => c.id === categoria)
      return cat?.name || 'Parceiros'
    }
    return 'Todos os Parceiros'
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header com busca */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="px-4 py-3">
          <SearchInput
            value={search}
            onSearch={handleSearch}
            placeholder="Buscar parceiros..."
          />
        </div>

        {/* Filtro de categorias */}
        <div className="px-4 pb-3">
          <CategoryFilter
            categories={categories}
            selected={categoria || null}
            onChange={handleCategoryChange}
          />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 py-4">
        {/* Título e contagem */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold">{getTitle()}</h1>
          <span className="text-sm text-muted-foreground">
            {pagination.total} parceiro{pagination.total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Lista vazia */}
        {!loading && parceiros.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum parceiro encontrado
            </p>
            {(search || categoria) && (
              <button
                onClick={() => updateParams({ search: null, categoria: null })}
                className="mt-2 text-primary text-sm underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Grid de parceiros */}
        {!loading && parceiros.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {parceiros.map(parceiro => (
              <ParceiroCardGrid key={parceiro.id} parceiro={parceiro} />
            ))}
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
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ParceirosContent />
    </Suspense>
  )
}
