'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Search, TrendingUp, ChevronRight, Loader2, Sparkles } from 'lucide-react'
import { SearchInput } from '@/components/app/parceiros'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  banner?: string
  count?: number
}

const POPULAR = [
  'Restaurante', 'Farmácia', 'Beleza', 'Saúde',
  'Academia', 'Pet Shop', 'Supermercado', 'Oficina'
]

export default function BuscarPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/app/parceiros?limit=1')
        const data = await res.json()
        if (data.categories) setCategories(data.categories)
      } catch (e) {
        console.error('Erro ao buscar categorias:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  const handleSearch = useCallback((v: string) => {
    if (v.trim()) router.push(`/app/parceiros?search=${encodeURIComponent(v.trim())}`)
  }, [router])

  return (
    <div className="pb-24 px-4 lg:px-0 pt-4 lg:pt-0">
      {/* Search */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Buscar</h1>
        <SearchInput onChange={handleSearch} placeholder="O que você está procurando?" autoFocus />
      </div>

      {/* Populares */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-900">Buscas populares</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR.map(term => (
            <button
              key={term}
              onClick={() => router.push(`/app/parceiros?search=${encodeURIComponent(term)}`)}
              className="px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95"
            >
              {term}
            </button>
          ))}
        </div>
      </section>

      {/* Categorias */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-900">Explorar por categoria</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">Nenhuma categoria disponível</p>
        ) : (
          <div className="space-y-1.5">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => router.push(`/app/parceiros?categoria=${cat.id}`)}
                className="flex items-center justify-between w-full p-3 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center overflow-hidden">
                    {cat.banner ? (
                      <Image src={cat.banner} alt={cat.name} width={40} height={40} className="object-cover w-full h-full" unoptimized />
                    ) : (
                      <Search className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm text-gray-900">{cat.name}</p>
                    {cat.count !== undefined && cat.count > 0 && (
                      <p className="text-[11px] text-gray-400">{cat.count} parceiro{cat.count !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Link */}
      <Link href="/app/parceiros" className="block text-center text-sm font-medium text-blue-600 hover:text-blue-700 py-4 mt-2">
        Ver todos os parceiros →
      </Link>
    </div>
  )
}
