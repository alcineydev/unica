'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Destaque {
  id: string
  nomeFantasia: string
  bannerDestaque: string | null
  logo: string | null
}

interface CarouselDestaquesProps {
  destaques: Destaque[]
}

export function CarouselDestaques({ destaques }: CarouselDestaquesProps) {
  const [current, setCurrent] = useState(0)

  // Auto-play
  useEffect(() => {
    if (destaques.length <= 1) return

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % destaques.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [destaques.length])

  if (!destaques.length) return null

  const prev = () => setCurrent((c) => (c - 1 + destaques.length) % destaques.length)
  const next = () => setCurrent((c) => (c + 1) % destaques.length)

  return (
    <div className="relative w-full aspect-[4/1] rounded-xl overflow-hidden bg-gray-100">
      {/* Slides */}
      {destaques.map((destaque, index) => (
        <Link
          key={destaque.id}
          href={`/app/parceiros/${destaque.id}`}
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            index === current ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          {destaque.bannerDestaque ? (
            <Image
              src={destaque.bannerDestaque}
              alt={destaque.nomeFantasia}
              fill
              className="object-cover"
              priority={index === 0}
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center">
              <span className="text-white text-xl font-bold">{destaque.nomeFantasia}</span>
            </div>
          )}

          {/* Overlay com nome */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-semibold text-lg drop-shadow-lg">
              {destaque.nomeFantasia}
            </h3>
          </div>
        </Link>
      ))}

      {/* Navegacao */}
      {destaques.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 text-white hover:bg-black/50 transition z-10"
            title="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 text-white hover:bg-black/50 transition z-10"
            title="Próximo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {destaques.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.preventDefault(); setCurrent(index); }}
                title={`Slide ${index + 1}`}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === current ? "bg-white w-4" : "bg-white/50"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
