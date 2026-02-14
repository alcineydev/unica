'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowDownLeft, ArrowUpRight, Gift, Coins,
  RotateCcw, Receipt
} from 'lucide-react'

interface Transaction {
  id: string
  type: 'PURCHASE' | 'CASHBACK' | 'BONUS' | 'MONTHLY_POINTS' | 'REFUND'
  amount: number
  cashback: number
  discount: number
  pointsUsed: number
  description: string
  status: string
  createdAt: string
  parceiro: {
    id: string
    name: string
    logo: string | null
    category: string
  } | null
}

const TYPE_CONFIG: Record<string, {
  icon: typeof ArrowDownLeft
  color: string
  bg: string
  prefix: string
}> = {
  PURCHASE: { icon: ArrowUpRight, color: 'text-red-500', bg: 'bg-red-50', prefix: '-' },
  CASHBACK: { icon: ArrowDownLeft, color: 'text-green-600', bg: 'bg-green-50', prefix: '+' },
  BONUS: { icon: Gift, color: 'text-violet-600', bg: 'bg-violet-50', prefix: '+' },
  MONTHLY_POINTS: { icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50', prefix: '+' },
  REFUND: { icon: RotateCcw, color: 'text-blue-600', bg: 'bg-blue-50', prefix: '+' },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return 'Agora mesmo'
  if (diffHours < 24) return `${diffHours}h atrás`
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `${diffDays} dias atrás`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    PURCHASE: 'Compra',
    CASHBACK: 'Cashback',
    BONUS: 'Bônus',
    MONTHLY_POINTS: 'Pontos mensais',
    REFUND: 'Reembolso',
  }
  return labels[type] || type
}

interface RecentTransactionsProps {
  showValues: boolean
}

export function RecentTransactions({ showValues }: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch('/api/app/transactions?limit=5')
        const data = await res.json()
        if (data.transactions) setTransactions(data.transactions)
      } catch (error) {
        console.error('Erro ao buscar transações:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [])

  // Não renderizar nada se não tem transações
  if (!loading && transactions.length === 0) return null

  // Loading
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <Receipt className="h-4 w-4 text-blue-600" /> Atividade Recente
        </h2>
        <Link href="/app/carteira" className="text-xs font-medium text-blue-600 hover:text-blue-700">
          Ver extrato →
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
        {transactions.map((tx) => {
          const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.PURCHASE
          const Icon = config.icon
          const displayAmount = tx.type === 'PURCHASE' ? tx.amount : (tx.cashback || tx.amount)

          return (
            <div key={tx.id} className="flex items-center gap-3 px-3.5 py-3">
              {/* Ícone ou logo do parceiro */}
              <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0 overflow-hidden`}>
                {tx.parceiro?.logo ? (
                  <Image src={tx.parceiro.logo} alt={tx.parceiro.name} width={40} height={40} className="object-cover w-full h-full" unoptimized />
                ) : (
                  <Icon className={`h-4 w-4 ${config.color}`} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {tx.parceiro?.name || getTypeLabel(tx.type)}
                </p>
                <p className="text-[10px] text-gray-400">
                  {getTypeLabel(tx.type)} · {formatDate(tx.createdAt)}
                </p>
              </div>

              {/* Valor */}
              <div className="text-right shrink-0">
                <p className={`text-sm font-semibold ${
                  tx.type === 'PURCHASE' ? 'text-gray-900' : 'text-green-600'
                }`}>
                  {showValues
                    ? `${config.prefix} ${formatCurrency(displayAmount)}`
                    : '•••'
                  }
                </p>
                {tx.cashback > 0 && tx.type === 'PURCHASE' && showValues && (
                  <p className="text-[10px] text-green-500">+{formatCurrency(tx.cashback)} cash</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
