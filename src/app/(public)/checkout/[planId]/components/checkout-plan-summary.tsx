'use client'

import { Crown, Check, Shield, Lock } from 'lucide-react'

interface Plan {
  id: string
  name: string
  description?: string | null
  price: number
  period: string
  features?: string[]
  planBenefits?: { benefit: { name: string } }[]
}

interface Props {
  plan: Plan
}

export default function CheckoutPlanSummary({ plan }: Props) {
  const price = Number(plan.price)
  const periodLabel = plan.period === 'YEARLY' ? '/ano' : plan.period === 'SINGLE' ? ' único' : '/mês'

  const features = plan.features || []
  const benefitNames = plan.planBenefits?.map(pb => pb.benefit.name) || []
  const allItems = features.length > 0 ? features : benefitNames
  const displayItems = allItems.length > 0 ? allItems : ['Acesso ao app', 'Cartão digital QR Code', 'Suporte via WhatsApp']

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm sticky top-24">
      {/* Header do plano */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Crown className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">{plan.name}</h3>
            <p className="text-[11px] text-gray-400">UNICA Clube de Benefícios</p>
          </div>
        </div>
        {plan.description && (
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{plan.description}</p>
        )}
      </div>

      {/* Preço */}
      <div className="p-5 border-b border-gray-100">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Total</p>
        <div className="flex items-baseline gap-1">
          <span className="text-sm text-gray-400 font-medium">R$</span>
          <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {price.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-sm text-gray-400">{periodLabel}</span>
        </div>
      </div>

      {/* Features incluídas */}
      <div className="p-5 space-y-2.5">
        <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-[0.1em]">Incluso</p>
        {displayItems.slice(0, 5).map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
            <span className="text-[12px] text-gray-500">{item}</span>
          </div>
        ))}
        {displayItems.length > 5 && (
          <p className="text-[11px] text-blue-500 font-medium">+{displayItems.length - 5} mais</p>
        )}
      </div>

      {/* Badges de segurança */}
      <div className="px-5 pb-5">
        <div className="flex items-center justify-center gap-3 text-[11px] text-gray-400 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-green-500" />
            <span>Pagamento seguro</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-green-500" />
            <span>Dados criptografados</span>
          </div>
        </div>
      </div>
    </div>
  )
}
