'use client'

import Link from 'next/link'
import { QrCode, Store, Star, User } from 'lucide-react'

const actions = [
  { icon: QrCode, label: 'Meu QR Code', href: '/app/carteira', color: 'bg-blue-50 text-blue-600' },
  { icon: Store, label: 'Parceiros', href: '/app/parceiros', color: 'bg-green-50 text-green-600' },
  { icon: Star, label: 'Avaliações', href: '/app/minhas-avaliacoes', color: 'bg-amber-50 text-amber-600' },
  { icon: User, label: 'Meu Perfil', href: '/app/perfil', color: 'bg-violet-50 text-violet-600' },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ icon: Icon, label, href, color }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all"
        >
          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-medium text-gray-600 text-center leading-tight">{label}</span>
        </Link>
      ))}
    </div>
  )
}
