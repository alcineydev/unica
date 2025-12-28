'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, TrendingUp, ChevronRight, Loader2 } from 'lucide-react'
import { SearchInput } from '@/components/app/parceiros'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  count?: number
}

const POPULAR_SEARCHES = [
  'Restaurante',
  'Farmácia',
  'Beleza',
  'Saúde',
  'Academia',
  'Pet Shop',
  'Supermercado',
  'Oficina'
]

export default function BuscarPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/app/parceiros?limit=1')
        const data = await res.json()
        if (data.categories) {
          setCategories(data.categories)
        }
      } catch (error) {
        console.error('Erro ao buscar categorias:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Handle search
  const handleSearch = useCallback((value: string) => {
    if (value.trim()) {
      router.push(`/app/parceiros?search=${encodeURIComponent(value.trim())}`)
    }
  }, [router])

  // Handle popular search click
  const handlePopularClick = useCallback((term: string) => {
    router.push(`/app/parceiros?search=${encodeURIComponent(term)}`)
  }, [router])

  // Handle category click
  const handleCategoryClick = useCallback((categoryId: string) => {
    router.push(`/app/parceiros?categoria=${categoryId}`)
  }, [router])

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-background border-b px-4 py-4">
        <h1 className="text-xl font-bold mb-3">Buscar</h1>
        <SearchInput
          onChange={handleSearch}
          placeholder="O que você está procurando?"
          autoFocus
        />
      </div>

      {/* Conteúdo */}
      <div className="px-4 py-4 space-y-6">
        {/* Buscas populares */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Buscas populares</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map(term => (
              <button
                key={term}
                onClick={() => handlePopularClick(term)}
                className="px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </section>

        {/* Categorias */}
        <section>
          <h2 className="font-semibold mb-3">Explorar por categoria</h2>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!loading && categories.length === 0 && (
            <p className="text-muted-foreground text-sm py-4">
              Nenhuma categoria disponível
            </p>
          )}

          {!loading && categories.length > 0 && (
            <div className="space-y-1">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Search className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{category.name}</p>
                      {category.count !== undefined && category.count > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {category.count} parceiro{category.count !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Link para ver todos */}
        <Link
          href="/app/parceiros"
          className="block text-center text-primary text-sm font-medium py-2"
        >
          Ver todos os parceiros
        </Link>
      </div>
    </div>
  )
}
