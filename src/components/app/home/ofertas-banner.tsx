'use client'

import Link from 'next/link'
import { MapPin, ChevronRight } from 'lucide-react'

interface OfertasBannerProps {
  cidade?: string
}

export function OfertasBanner({ cidade = 'sua região' }: OfertasBannerProps) {
  return (
    <Link
      href="/app/parceiros?proximos=true"
      className="block relative w-full rounded-xl overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 p-4"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-blue-100 text-xs">
            <MapPin className="h-3 w-3" />
            <span>Ofertas em {cidade}</span>
          </div>
          <h3 className="text-white font-bold text-lg">Ofertas Próximas</h3>
          <p className="text-blue-100 text-sm">
            Descubra parceiros perto de você
          </p>
        </div>
        <div className="bg-white/20 rounded-full p-2">
          <ChevronRight className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Decoração */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full" />
    </Link>
  )
}
