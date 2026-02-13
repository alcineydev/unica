'use client'

import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Receipt,
  TrendingUp,
  ArrowDownUp,
  Search,
  ShoppingCart,
  Gift,
  Coins,
  Undo2,
} from 'lucide-react'

interface Transaction {
  id: string
  type: string
  description?: string
  amount: number | string
  status: string
  createdAt: string
  parceiro?: {
    tradeName?: string
    companyName?: string
  }
}

interface Stats {
  totalTransactions?: number
  totalSpent?: number
  totalCashback?: number
  totalPointsUsed?: number
  totalDiscounts?: number
}

interface FinancialTabProps {
  assinante: Record<string, unknown>
  stats: Stats
}

const TYPE_MAP: Record<
  string,
  { label: string; icon: typeof Receipt; color: string }
> = {
  PURCHASE: {
    label: 'Compra',
    icon: ShoppingCart,
    color: 'text-blue-600 bg-blue-50',
  },
  CASHBACK: {
    label: 'Cashback',
    icon: ArrowDownUp,
    color: 'text-green-600 bg-green-50',
  },
  BONUS: {
    label: 'Bônus',
    icon: Gift,
    color: 'text-purple-600 bg-purple-50',
  },
  MONTHLY_POINTS: {
    label: 'Pontos Mensais',
    icon: Coins,
    color: 'text-orange-600 bg-orange-50',
  },
  REFUND: {
    label: 'Estorno',
    icon: Undo2,
    color: 'text-red-600 bg-red-50',
  },
}

const STATUS_MAP: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  COMPLETED: { label: 'Concluída', variant: 'default' },
  PENDING: { label: 'Pendente', variant: 'secondary' },
  FAILED: { label: 'Falhou', variant: 'destructive' },
  CANCELLED: { label: 'Cancelada', variant: 'outline' },
}

export default function SubscriberFinancialTab({
  assinante,
  stats,
}: FinancialTabProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const transactions = (assinante.transactions || []) as Transaction[]

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const searchLower = search.toLowerCase()
      const matchSearch =
        !search ||
        t.description?.toLowerCase().includes(searchLower) ||
        t.parceiro?.tradeName?.toLowerCase().includes(searchLower) ||
        t.parceiro?.companyName?.toLowerCase().includes(searchLower)

      const matchType = typeFilter === 'all' || t.type === typeFilter

      return matchSearch && matchType
    })
  }, [transactions, search, typeFilter])

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Receipt className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Gasto</p>
                <p className="text-lg font-bold">
                  R$ {(stats?.totalSpent || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                <ArrowDownUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cashback</p>
                <p className="text-lg font-bold text-green-600">
                  R$ {(stats?.totalCashback || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Descontos</p>
                <p className="text-lg font-bold text-purple-600">
                  R$ {(stats?.totalDiscounts || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <Coins className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Transações</p>
                <p className="text-lg font-bold">
                  {stats?.totalTransactions || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de transações */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Transações</CardTitle>
              <CardDescription>
                {filtered.length} transação(ões)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(TYPE_MAP).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Parceiro</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => {
                    const typeInfo = TYPE_MAP[t.type] || {
                      label: t.type,
                      icon: Receipt,
                      color: 'text-gray-600 bg-gray-50',
                    }
                    const statusInfo = STATUS_MAP[t.status] || {
                      label: t.status,
                      variant: 'outline' as const,
                    }
                    const Icon = typeInfo.icon

                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}
                          >
                            <Icon className="h-3 w-3" />
                            {typeInfo.label}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">
                          {t.description}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.parceiro?.tradeName ||
                            t.parceiro?.companyName ||
                            '—'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {Number(t.amount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusInfo.variant}
                            className="text-[10px]"
                          >
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
