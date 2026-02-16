import Image from 'next/image'
import Link from 'next/link'

export interface ParceiroCardData {
  id: string
  name: string
  tradeName?: string | null
  logo?: string | null
  category?: string | null
  city?: string | null
  desconto?: string | null
}

interface ParceiroCardProps {
  parceiro: ParceiroCardData
}

function getBadgeColor(desconto: string) {
  if (desconto.includes('Cash')) return 'bg-amber-500'
  if (desconto.includes('pts')) return 'bg-blue-500'
  return 'bg-green-500'
}

export function ParceiroCard({ parceiro: p }: ParceiroCardProps) {
  const displayName = p.tradeName || p.name
  const initials = displayName.substring(0, 2).toUpperCase()

  return (
    <Link
      href={`/app/parceiros/${p.id}`}
      className="bg-white rounded-[14px] border border-gray-100 overflow-hidden hover:shadow-md active:scale-[0.97] transition-all"
    >
      {/* Logo FULL — ocupa todo o topo */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-blue-50/30 border-b border-gray-100">
        {p.logo ? (
          <Image
            src={p.logo}
            alt={displayName}
            fill
            className="object-contain p-3 lg:p-4"
            sizes="(max-width: 768px) 33vw, 200px"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl lg:text-3xl font-extrabold text-blue-400/60">
              {initials}
            </span>
          </div>
        )}

        {/* Badge flutuante */}
        {p.desconto && (
          <span className={`absolute top-1.5 right-1.5 lg:top-2 lg:right-2 px-1.5 lg:px-2 py-0.5 rounded-md text-[8px] lg:text-[9px] font-extrabold text-white shadow-sm ${getBadgeColor(p.desconto)}`}>
            {p.desconto}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2 lg:p-2.5 text-center">
        <p className="text-[11px] lg:text-xs font-bold text-gray-900 truncate">{displayName}</p>
        <p className="text-[9px] lg:text-[10px] text-gray-400 mt-0.5 flex items-center justify-center gap-1">
          {p.category && <span>{p.category}</span>}
          {p.category && p.city && (
            <span className="w-[2px] h-[2px] rounded-full bg-gray-300 inline-block" />
          )}
          {p.city && <span>{p.city}</span>}
        </p>
      </div>
    </Link>
  )
}
