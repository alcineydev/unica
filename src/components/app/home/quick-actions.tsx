'use client'

import Link from 'next/link'
import {
  QrCode,
  Wallet,
  Gift,
  HelpCircle,
  FileText,
  Settings
} from 'lucide-react'

const actions = [
  { href: '/app/meu-qrcode', icon: QrCode, label: 'Meu QR' },
  { href: '/app/carteira', icon: Wallet, label: 'Carteira' },
  { href: '/app/beneficios', icon: Gift, label: 'Benefícios' },
  { href: '/app/ajuda', icon: HelpCircle, label: 'Ajuda' },
  { href: '/app/termos', icon: FileText, label: 'Termos' },
  { href: '/app/perfil', icon: Settings, label: 'Config.' },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-6 gap-2">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <action.icon className="h-5 w-5 text-primary" />
          </div>
          <span className="text-[10px] text-center text-muted-foreground font-medium line-clamp-1">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  )
}
