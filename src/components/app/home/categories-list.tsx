'use client'

import Link from 'next/link'
import {
  Car,
  UtensilsCrossed,
  Scissors,
  Heart,
  Wrench,
  ShoppingBag,
  Store,
  GraduationCap,
  Stethoscope,
  Home,
  Plane,
  Camera,
  Music,
  Gamepad2,
  Sparkles,
  Dumbbell,
  Briefcase,
  Shirt,
  Coffee,
  type LucideIcon
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  Car,
  UtensilsCrossed,
  Utensils: UtensilsCrossed,
  Scissors,
  Heart,
  Wrench,
  ShoppingBag,
  Store,
  GraduationCap,
  Stethoscope,
  Home,
  Plane,
  Camera,
  Music,
  Gamepad2,
  Sparkles,
  Dumbbell,
  Briefcase,
  Shirt,
  Coffee
}

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
        {categories.map((category) => {
          const IconComponent = iconMap[category.icon] || Store

          return (
            <Link
              key={category.id}
              href={`/app/parceiros?categoria=${category.slug}`}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border hover:border-primary hover:shadow-md transition-all min-w-[80px]"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <IconComponent className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs font-medium text-center line-clamp-1">
                {category.name}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
