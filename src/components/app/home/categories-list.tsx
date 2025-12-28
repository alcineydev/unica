'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Store } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  banner: string | null
}

interface CategoriesListProps {
  categories: Category[]
}

export function CategoriesList({ categories }: CategoriesListProps) {
  if (!categories.length) return null

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex gap-3" style={{ width: 'max-content' }}>
        {categories.map((category) => {
          const hasValidBanner = category.banner &&
            (category.banner.startsWith('http') || category.banner.startsWith('/'))

          return (
            <Link
              key={category.id}
              href={`/app/categoria/${category.slug}`}
              className="relative flex-shrink-0 w-[120px] h-[80px] rounded-xl overflow-hidden group"
            >
              {/* Imagem de fundo */}
              {hasValidBanner ? (
                <Image
                  src={category.banner!}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Store className="h-8 w-8 text-white/70" />
                </div>
              )}

              {/* Overlay gradiente */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Nome da categoria */}
              <div className="absolute bottom-2 left-2 right-2">
                <span className="text-white text-xs font-semibold line-clamp-1 drop-shadow">
                  {category.name}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
