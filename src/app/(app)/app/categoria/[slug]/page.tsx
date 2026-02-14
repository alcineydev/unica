'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Loader2, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ParceiroCardGrid } from '@/components/app/home/parceiro-card-grid'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  banner: string | null
  description: string | null
}

interface Parceiro {
  id: string
  nomeFantasia: string
  logo: string | null
  rating?: number
  totalAvaliacoes?: number
  city?: { name: string } | null
  categoryRef?: { name: string } | null
  desconto?: string | null
  isDestaque?: boolean
}

interface PageData {
  category: Category
  parceiros: Parceiro[]
  total: number
  error?: string
  categoriasDisponiveis?: { id: string; slug: string; name: string }[]
}

export default function CategoriaPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!params.slug) return

    const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug

    fetch(`/api/app/categorias/${slug}`)
      .then(res => res.json())
      .then(json => {
        if (json.error) {
          setError(json.error)
          console.log('Slug buscado:', json.slugBuscado)
          console.log('Categorias disponíveis:', json.categoriasDisponiveis)
        } else {
          setData(json)
        }
      })
      .catch(err => {
        console.error('Erro:', err)
        setError('Erro ao carregar categoria')
      })
      .finally(() => setLoading(false))
  }, [params.slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !data?.category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <Store className="h-12 w-12 text-gray-500" />
        <p className="text-gray-500 text-center">{error || 'Categoria não encontrada'}</p>
        <Button onClick={() => router.back()}>Voltar</Button>
      </div>
    )
  }

  const { category, parceiros, total } = data

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 px-4 lg:px-0 pt-4 lg:pt-0">
      {/* Header com Banner */}
      <div className="relative">
        {/* Banner da Categoria */}
        <div className="relative w-full h-40 bg-gray-100">
          {category.banner ? (
            <Image
              src={category.banner}
              alt={category.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-400" />
          )}

          {/* Overlay gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Botão Voltar */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 text-white rounded-full"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Título da Categoria */}
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-2xl font-bold text-white">{category.name}</h1>
            <p className="text-white/80 text-sm">
              {total} {total === 1 ? 'parceiro' : 'parceiros'}
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-4">
        {/* Descrição da categoria */}
        {category.description && (
          <p className="text-sm text-gray-500">
            {category.description}
          </p>
        )}

        {/* Lista de Parceiros */}
        {parceiros.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {parceiros.map((parceiro) => (
              <ParceiroCardGrid key={parceiro.id} parceiro={parceiro} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Store className="h-12 w-12 mx-auto text-gray-500 mb-3" />
            <p className="text-gray-500">
              Nenhum parceiro nesta categoria ainda
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
