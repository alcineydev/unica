'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ParceiroCardGridProps {
  parceiro: {
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
}

export function ParceiroCardGrid({ parceiro }: ParceiroCardGridProps) {
  const rating = parceiro.rating || 0

  return (
    <Link
      href={`/app/parceiros/${parceiro.id}`}
      className="flex flex-col bg-card border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all"
    >
      {/* Logo */}
      <div className="relative w-full aspect-square bg-muted">
        {parceiro.logo ? (
          <Image
            src={parceiro.logo}
            alt={parceiro.nomeFantasia}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Building2 className="h-10 w-10 text-primary/40" />
          </div>
        )}

        {/* Badge de desconto */}
        {parceiro.desconto && (
          <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-500 text-white text-[10px] px-1.5 py-0.5">
            {parceiro.desconto}
          </Badge>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <h3 className="font-semibold text-sm line-clamp-1">{parceiro.nomeFantasia}</h3>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {rating > 0 && (
            <>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{rating.toFixed(1)}</span>
              <span>-</span>
            </>
          )}
          <span className="line-clamp-1">
            {parceiro.categoryRef?.name || parceiro.category || 'Parceiro'}
          </span>
        </div>

        {parceiro.city && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{parceiro.city.name}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
