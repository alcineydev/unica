'use client'

import Link from 'next/link'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  banner: string
}

interface CategoriesListProps {
  categories: Category[]
}

export function CategoriesList({ categories }: CategoriesListProps) {
  if (!categories.length) return null

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex gap-3" style={{ width: 'max-content' }}>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/app/categoria/${category.slug}`}
            className="flex flex-col items-center gap-2 min-w-[80px]"
          >
            {/* Imagem da categoria (banner) */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted border shadow-sm">
              {category.banner ? (
                <Image
                  src={category.banner}
                  alt={category.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {category.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-center line-clamp-1">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
