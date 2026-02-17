'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Store } from 'lucide-react'
import { ParceiroCard, ParceiroCardData } from '@/components/app/parceiros/parceiro-card'
import { CategoryFilter } from '@/components/app/parceiros/category-filter'

const MAX_AUTO_LOADS = 3
const PAGE_SIZE = 12

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  count?: number
}

interface ApiResponse {
  data: Array<{
    id: string
    nomeFantasia: string
    tradeName?: string | null
    logo: string | null
    category?: string
    categoryRef?: { name: string } | null
    city?: { name: string } | null
    desconto?: string | null
  }>
  categories: Category[]
  nextCursor: string | null
  totalCount: number
  hasMore: boolean
}

export default function ParceirosPage() {
  // Data
  const [parceiros, setParceiros] = useState<ParceiroCardData[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [autoLoadCount, setAutoLoadCount] = useState(0)

  // Refs
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Fetch parceiros
  const fetchParceiros = useCallback(async (reset = false, cursorOverride?: string | null) => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    if (reset) {
      setIsLoading(true)
      setAutoLoadCount(0)
    } else {
      setIsLoadingMore(true)
    }

    const params = new URLSearchParams({
      limit: PAGE_SIZE.toString(),
    })
    if (search) params.set('search', search)
    if (selectedCategory) params.set('categoria', selectedCategory)

    const effectiveCursor = reset ? null : (cursorOverride ?? nextCursor)
    if (effectiveCursor) params.set('cursor', effectiveCursor)

    try {
      const res = await fetch(`/api/app/parceiros?${params}`, {
        signal: controller.signal,
      })
      const data: ApiResponse = await res.json()

      // Map API data to ParceiroCardData
      const mapped: ParceiroCardData[] = (data.data || []).map(p => ({
        id: p.id,
        name: p.nomeFantasia,
        tradeName: p.tradeName,
        logo: p.logo,
        category: p.categoryRef?.name || p.category || null,
        city: p.city?.name || null,
        desconto: p.desconto || null,
      }))

      if (reset) {
        setParceiros(mapped)
      } else {
        setParceiros(prev => [...prev, ...mapped])
      }

      // Categories only from first load
      if (data.categories && data.categories.length > 0) {
        setCategories(data.categories)
      }

      setNextCursor(data.nextCursor || null)
      setTotalCount(data.totalCount || 0)
      setHasMore(data.hasMore || false)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Erro ao buscar parceiros:', error)
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [search, selectedCategory, nextCursor])

  // Initial load + filter changes
  useEffect(() => {
    fetchParceiros(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategory])

  // Load more
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoading) return
    setAutoLoadCount(prev => prev + 1)
    fetchParceiros(false)
  }, [hasMore, isLoadingMore, isLoading, fetchParceiros])

  // IntersectionObserver for auto-load
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    if (autoLoadCount >= MAX_AUTO_LOADS || !hasMore || isLoading) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && autoLoadCount < MAX_AUTO_LOADS) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [hasMore, isLoadingMore, isLoading, autoLoadCount, loadMore])

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(value)
    }, 300)
  }, [])

  // Category filter
  const handleCategorySelect = useCallback((id: string | null) => {
    setSelectedCategory(id)
  }, [])

  const handleClearFilters = useCallback(() => {
    setSearch('')
    setSelectedCategory(null)
    const input = document.querySelector('input[placeholder="Buscar parceiro..."]') as HTMLInputElement
    if (input) input.value = ''
  }, [])

  const loadedCount = parceiros.length
  const progressPercent = totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 0
  const hasFilters = search || selectedCategory

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">

      {/* ===== HEADER STICKY ===== */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-100">
        <div className="px-4 pt-3 pb-3">
          {/* Title + count */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-extrabold text-gray-900">Parceiros</h1>
            <span className="text-xs text-gray-400 font-medium">
              {totalCount} {totalCount === 1 ? 'parceiro' : 'parceiros'}
            </span>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3.5 py-2.5 mb-3">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar parceiro..."
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              onChange={(e) => handleSearchChange(e.target.value)}
              defaultValue={search}
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('')
                  const input = document.querySelector('input[placeholder="Buscar parceiro..."]') as HTMLInputElement
                  if (input) input.value = ''
                }}
                className="p-0.5"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Category chips — reuse existing component */}
          {categories.length > 0 && (
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onChange={handleCategorySelect}
            />
          )}
        </div>
      </div>

      {/* ===== RESULTS INFO ===== */}
      {!isLoading && (
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <p className="text-xs text-gray-500">
            <span className="font-bold text-gray-900">{totalCount}</span> parceiros encontrados
          </p>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
      )}

      {/* ===== LOADING INITIAL — Skeleton Grid ===== */}
      {isLoading && (
        <div className="grid grid-cols-3 gap-2 px-4 pt-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[14px] border border-gray-100 overflow-hidden">
              <div className="w-full aspect-square bg-gray-100 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
              </div>
              <div className="p-2 space-y-1.5">
                <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5 mx-auto" />
                <div className="h-2 bg-gray-100 rounded animate-pulse w-3/5 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== GRID ===== */}
      {!isLoading && parceiros.length > 0 && (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-4 pt-2">
            {parceiros.map((p) => (
              <ParceiroCard key={p.id} parceiro={p} />
            ))}

            {/* Skeleton cards while loading more */}
            {isLoadingMore && Array.from({ length: 3 }).map((_, i) => (
              <div key={`skel-${i}`} className="bg-white rounded-[14px] border border-gray-100 overflow-hidden">
                <div className="w-full aspect-square bg-gray-100 animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                </div>
                <div className="p-2 space-y-1.5">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5 mx-auto" />
                  <div className="h-2 bg-gray-100 rounded animate-pulse w-3/5 mx-auto" />
                </div>
              </div>
            ))}
          </div>

          {/* Sentinel for IntersectionObserver (auto-load) */}
          {hasMore && autoLoadCount < MAX_AUTO_LOADS && (
            <div ref={sentinelRef} className="h-4" />
          )}

          {/* Loading indicator (auto-load) */}
          {isLoadingMore && (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-[11px] text-gray-400">Carregando mais parceiros...</span>
            </div>
          )}

          {/* Manual "Load More" button (after MAX_AUTO_LOADS) */}
          {hasMore && autoLoadCount >= MAX_AUTO_LOADS && !isLoadingMore && (
            <div className="px-4 pt-3 pb-2">
              <button
                onClick={loadMore}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-200 active:scale-[0.98] transition-all"
              >
                Carregar mais parceiros
                <span className="text-xs text-gray-400 font-normal">
                  · {totalCount - loadedCount} restantes
                </span>
              </button>

              {/* Progress bar */}
              <div className="mt-2 text-center">
                <div className="w-full h-[3px] bg-gray-100 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">
                  {loadedCount} de {totalCount} parceiros carregados
                </span>
              </div>
            </div>
          )}

          {/* All loaded */}
          {!hasMore && parceiros.length > 0 && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-[11px] text-green-600 font-semibold">✓</span>
                <span className="text-[11px] text-green-600 font-semibold">
                  Todos os {totalCount} parceiros carregados
                </span>
              </div>
              <div className="w-48 h-[3px] bg-gray-100 rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-green-500 rounded-full w-full" />
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== EMPTY STATE ===== */}
      {!isLoading && parceiros.length === 0 && (
        <div className="flex flex-col items-center justify-center pt-16 px-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-gray-300" />
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-1">
            Nenhum parceiro encontrado
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            Tente buscar com outro termo ou limpe os filtros
          </p>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}
