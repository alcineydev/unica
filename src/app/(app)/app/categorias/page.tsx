'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Loader2, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  banner: string
  isActive?: boolean
  count?: number
}

export default function CategoriasPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/app/parceiros?limit=1')
      const data = await res.json()
      if (data.categories) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchCategories()
  }, [pathname, fetchCategories])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 px-4 pt-4 lg:px-10 lg:pt-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#f8fafc] border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Categorias</h1>
        </div>
      </div>

      {/* Lista de Categorias */}
      <div className="p-4">
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/app/categoria/${category.slug}`}
                className="relative overflow-hidden rounded-xl aspect-[4/3] group"
              >
                {/* Banner */}
                {category.banner ? (
                  <Image
                    src={category.banner}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-400" />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Conteúdo */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-bold text-lg">{category.name}</h3>
                  {category.count !== undefined && category.count > 0 && (
                    <p className="text-white/70 text-sm">
                      {category.count} {category.count === 1 ? 'parceiro' : 'parceiros'}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Store className="h-12 w-12 mx-auto text-gray-500 mb-3" />
            <p className="text-gray-500">Nenhuma categoria disponível</p>
          </div>
        )}
      </div>
    </div>
  )
}
