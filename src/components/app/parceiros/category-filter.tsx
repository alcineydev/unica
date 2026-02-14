'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  count?: number
}

interface CategoryFilterProps {
  categories: Category[]
  selected?: string | null
  onChange?: (categoryId: string | null) => void
  className?: string
}

export function CategoryFilter({
  categories,
  selected,
  onChange,
  className
}: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  // Scroll to selected category on mount
  useEffect(() => {
    if (selected && selectedRef.current && scrollRef.current) {
      const container = scrollRef.current
      const element = selectedRef.current
      const containerWidth = container.offsetWidth
      const elementLeft = element.offsetLeft
      const elementWidth = element.offsetWidth

      container.scrollTo({
        left: elementLeft - containerWidth / 2 + elementWidth / 2,
        behavior: 'smooth'
      })
    }
  }, [selected])

  return (
    <div className={cn('relative', className)}>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
        
      >
        {/* Botão "Todos" */}
        <button
          ref={!selected ? selectedRef : undefined}
          onClick={() => onChange?.(null)}
          className={cn(
            'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all',
            !selected
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          )}
        >
          Todos
        </button>

        {/* Botões de categorias */}
        {categories.map(category => (
          <button
            key={category.id}
            ref={selected === category.id ? selectedRef : undefined}
            onClick={() => onChange?.(category.id)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
              selected === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
          >
            {category.name}
            {category.count !== undefined && category.count > 0 && (
              <span className="ml-1.5 text-xs opacity-70">
                ({category.count})
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
