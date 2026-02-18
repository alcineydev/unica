'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Destaque {
  id: string
  nomeFantasia: string
  logo: string | null
  bannerDestaque: string | null
  banner: string | null
  category: string | null
  desconto: string | null
  cashback: string | null
}

interface CarouselDestaquesProps {
  destaques: Destaque[]
}

export function CarouselDestaques({ destaques }: CarouselDestaquesProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  const handleScroll = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const maxScroll = track.scrollWidth - track.clientWidth
    if (maxScroll > 0) {
      setScrollProgress(track.scrollLeft / maxScroll)
    }
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    track.addEventListener('scroll', handleScroll, { passive: true })
    return () => track.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  if (!destaques || destaques.length === 0) return null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <span className="text-blue-600">✨</span> Em Destaque
        </h2>
        <Link href="/app/parceiros?destaque=true" prefetch={false} className="text-xs font-medium text-blue-600">
          Ver todos →
        </Link>
      </div>

      {/* Peek Carousel */}
      <div className="overflow-hidden -mx-4 px-4">
        <div
          ref={trackRef}
          className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1"
          style={{
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingRight: '40px',
          }}
        >
          {destaques.map((destaque) => {
            const bannerUrl = destaque.bannerDestaque || destaque.banner
            let badgeText = ''
            let badgeClass = 'bg-green-500/90'
            if (destaque.desconto) {
              badgeText = destaque.desconto
            } else if (destaque.cashback) {
              badgeText = destaque.cashback
              badgeClass = 'bg-amber-500/90'
            }

            return (
              <Link
                key={destaque.id}
                href={`/app/parceiros/${destaque.id}`}
                prefetch={false}
                className="flex-shrink-0 snap-start active:scale-[0.98] transition-transform"
                style={{ width: 'calc(100% - 40px)' }}
              >
                <div className="relative w-full aspect-[2.5/1] rounded-xl overflow-hidden bg-gray-100">
                  {bannerUrl ? (
                    <Image
                      src={bannerUrl}
                      alt={destaque.nomeFantasia}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 90vw, 400px"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
                  )}

                  {/* Overlay com info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex items-center gap-2">
                      {/* Logo */}
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-md overflow-hidden">
                        {destaque.logo ? (
                          <Image
                            src={destaque.logo}
                            alt={destaque.nomeFantasia}
                            width={32}
                            height={32}
                            className="object-contain w-full h-full p-0.5"
                            unoptimized
                          />
                        ) : (
                          <span className="text-[9px] font-extrabold text-blue-600">
                            {destaque.nomeFantasia.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Nome + categoria */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[13px] font-bold truncate">
                          {destaque.nomeFantasia}
                        </p>
                        {destaque.category && (
                          <p className="text-white/50 text-[10px]">{destaque.category}</p>
                        )}
                      </div>

                      {/* Badge */}
                      {badgeText && (
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shrink-0 ${badgeClass}`}>
                          {badgeText}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Scroll indicator */}
      {destaques.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          <div className="h-[3px] rounded-full bg-gray-200 flex-1 max-w-[180px] relative overflow-hidden">
            <div
              className="absolute top-0 bottom-0 left-0 rounded-full bg-blue-600 transition-all duration-200"
              style={{
                width: `${Math.max(100 / destaques.length, 20)}%`,
                left: `${scrollProgress * (100 - 100 / destaques.length)}%`,
              }}
            />
          </div>
          <span className="text-[9px] text-gray-400 ml-1">Deslize →</span>
        </div>
      )}
    </div>
  )
}
