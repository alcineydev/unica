'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  DollarSign,
  ShoppingCart,
  MessageCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Phone,
  TrendingUp,
  Download,
  Loader2,
  Receipt,
  Gift,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tx {
  id: string
  type: string
  amount: number
  discountApplied: number
  cashbackGenerated: number
  cashbackUsed: number
  description: string
  createdAt: string
}

interface Cliente {
  id: string
  name: string
  email: string
  avatar: string | null
  cpf: string
  phone: string
  plan: string
  subscriptionStatus: string
  isActive: boolean
  compras: number
  comprasMes: number
  gastoTotal: number
  gastoMes: number
  cashbackAcumulado: number
  cashbackUsado: number
  cashbackDisponivel: number
  ultimaCompra: string | null
  transactions: Tx[]
}

interface Stats {
  totalClientes: number
  clientesMes: number
  faturamentoTotal: number
  faturamentoMes: number
  totalCompras: number
  comprasMes: number
  comWhatsapp: number
  percentWhatsapp: number
}

type FilterType = 'todos' | 'ativos' | 'inativos'
type SortType = 'recente' | 'gasto' | 'compras' | 'az'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const avatarColors = [
  { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-600 dark:text-blue-400' },
  { bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-500 dark:text-amber-400' },
  { bg: 'bg-violet-50 dark:bg-violet-950', text: 'text-violet-600 dark:text-violet-400' },
  { bg: 'bg-pink-50 dark:bg-pink-950', text: 'text-pink-600 dark:text-pink-400' },
  { bg: 'bg-cyan-50 dark:bg-cyan-950', text: 'text-cyan-600 dark:text-cyan-400' },
]

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const formatDate = (d: string | Date | null) => {
  if (!d) return '—'
  try {
    return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return '—'
  }
}

const formatDateTime = (d: string | Date) => {
  try {
    return format(new Date(d), "dd/MM HH:mm", { locale: ptBR })
  } catch {
    return '—'
  }
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

const maskCPF = (cpf: string) => {
  if (!cpf || cpf.length < 11) return cpf || '—'
  const clean = cpf.replace(/\D/g, '')
  return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.***-${clean.substring(9, 11)}`
}

const formatCPFDisplay = (cpf: string) => {
  if (!cpf || cpf.length < 11) return cpf || '—'
  const c = cpf.replace(/\D/g, '')
  return `${c.substring(0, 3)}.${c.substring(3, 6)}.${c.substring(6, 9)}-${c.substring(9, 11)}`
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('todos')
  const [sort, setSort] = useState<SortType>('recente')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/parceiro/clientes')
      if (!res.ok) throw new Error('Erro na resposta')
      const data = await res.json()
      setClientes(data.clientes || [])
      setStats(data.stats || null)
    } catch {
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  // Filtrar e ordenar
  const filteredClientes = useMemo(() => {
    let result = [...clientes]

    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.phone.includes(term) ||
          c.cpf.includes(term)
      )
    }

    if (filter === 'ativos') result = result.filter((c) => c.isActive)
    if (filter === 'inativos') result = result.filter((c) => !c.isActive)

    switch (sort) {
      case 'recente':
        result.sort((a, b) => {
          if (!a.ultimaCompra) return 1
          if (!b.ultimaCompra) return -1
          return new Date(b.ultimaCompra).getTime() - new Date(a.ultimaCompra).getTime()
        })
        break
      case 'gasto':
        result.sort((a, b) => b.gastoTotal - a.gastoTotal)
        break
      case 'compras':
        result.sort((a, b) => b.compras - a.compras)
        break
      case 'az':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return result
  }, [clientes, debouncedSearch, filter, sort])

  const handleWhatsApp = (cliente: Cliente) => {
    if (!cliente.phone) {
      toast.error('Cliente não possui telefone cadastrado')
      return
    }
    const clean = cliente.phone.replace(/\D/g, '')
    const number = clean.startsWith('55') ? clean : `55${clean}`
    window.open(`https://wa.me/${number}`, '_blank')
  }

  const exportCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'CPF', 'Plano', 'Status', 'Compras', 'Gasto Total', 'Cashback Disponível', 'Última Compra']
    const rows = filteredClientes.map((c) => [
      c.name,
      c.email,
      c.phone,
      c.cpf,
      c.plan,
      c.isActive ? 'Ativo' : 'Inativo',
      c.compras,
      c.gastoTotal.toFixed(2),
      c.cashbackDisponivel.toFixed(2),
      c.ultimaCompra ? formatDate(c.ultimaCompra) : '',
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'clientes.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stats?.totalClientes ?? 0} clientes no total
            {stats && stats.clientesMes > 0 && (
              <span className="text-emerald-600 font-medium ml-1">
                (+{stats.clientesMes} este mês)
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportCSV}
          className="flex-shrink-0"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* ── Stats Cards — scroll horizontal no mobile ── */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">

        {/* Total Clientes */}
        <Card className="min-w-[140px] flex-shrink-0 snap-start">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs text-muted-foreground">Clientes</span>
            </div>
            <p className="text-2xl font-bold">{stats?.totalClientes ?? 0}</p>
            {stats && stats.clientesMes > 0 && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +{stats.clientesMes} este mês
              </p>
            )}
          </CardContent>
        </Card>

        {/* Faturamento */}
        <Card className="min-w-[160px] flex-shrink-0 snap-start">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs text-muted-foreground">Faturamento</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">
              {formatCurrency(stats?.faturamentoTotal ?? 0)}
            </p>
            {stats && stats.faturamentoMes > 0 && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +{formatCurrency(stats.faturamentoMes)} mês
              </p>
            )}
          </CardContent>
        </Card>

        {/* Total Compras */}
        <Card className="min-w-[140px] flex-shrink-0 snap-start">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              </div>
              <span className="text-xs text-muted-foreground">Compras</span>
            </div>
            <p className="text-2xl font-bold">{stats?.totalCompras ?? 0}</p>
            {stats && stats.comprasMes > 0 && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +{stats.comprasMes} este mês
              </p>
            )}
          </CardContent>
        </Card>

        {/* Com WhatsApp */}
        <Card className="min-w-[140px] flex-shrink-0 snap-start">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-green-50 dark:bg-green-950 rounded-lg">
                <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs text-muted-foreground">WhatsApp</span>
            </div>
            <p className="text-2xl font-bold">{stats?.comWhatsapp ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.percentWhatsapp ?? 0}% dos clientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Filtros ── */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar por nome, email, telefone ou CPF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              {/* Chips status */}
              <div className="flex rounded-lg border overflow-hidden">
                {(['todos', 'ativos', 'inativos'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 text-xs font-medium transition-colors capitalize ${filter === f
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Ordenação */}
              <Select value={sort} onValueChange={(v) => setSort(v as SortType)}>
                <SelectTrigger className="w-[140px] sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recente">Mais Recente</SelectItem>
                  <SelectItem value="gasto">Maior Gasto</SelectItem>
                  <SelectItem value="compras">Mais Compras</SelectItem>
                  <SelectItem value="az">A → Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Lista de Clientes ── */}
      {filteredClientes.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold mb-1">
              {clientes.length === 0 ? 'Nenhum cliente ainda' : 'Sem resultados'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {clientes.length === 0
                ? 'Os clientes aparecerão aqui após fazerem compras'
                : 'Tente buscar com outros termos'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filteredClientes.map((cliente, idx) => {
            const color = avatarColors[idx % avatarColors.length]
            const isExpanded = expandedId === cliente.id

            return (
              <Card
                key={cliente.id}
                className={`overflow-hidden transition-shadow ${isExpanded ? 'ring-1 ring-primary/20 shadow-md' : 'hover:shadow-sm'}`}
              >
                {/* ── Card Header (clicável) ── */}
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedId(isExpanded ? null : cliente.id)}
                >
                  <CardContent className="p-3 sm:p-4">

                    {/* Desktop layout */}
                    <div className="hidden sm:grid grid-cols-[48px_1.5fr_1fr_1fr_1fr_80px] items-center gap-4">
                      {/* Avatar */}
                      <div className={`h-11 w-11 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${color.bg} ${color.text}`}>
                        {cliente.avatar ? (
                          <img src={cliente.avatar} alt={cliente.name} className="h-11 w-11 rounded-full object-cover" />
                        ) : (
                          getInitials(cliente.name)
                        )}
                      </div>

                      {/* Nome + info */}
                      <div className="min-w-0">
                        <p className="font-semibold truncate text-sm">{cliente.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{cliente.email}</p>
                        <p className="text-xs text-muted-foreground">{formatCPFDisplay(cliente.cpf)}</p>
                      </div>

                      {/* Compras */}
                      <div className="text-center">
                        <p className="font-bold text-base">{cliente.compras}</p>
                        <p className="text-xs text-muted-foreground">compras</p>
                        {cliente.comprasMes > 0 && (
                          <p className="text-xs text-emerald-600">+{cliente.comprasMes} mês</p>
                        )}
                      </div>

                      {/* Gasto */}
                      <div className="text-center">
                        <p className="font-bold text-base text-emerald-600">{formatCurrency(cliente.gastoTotal)}</p>
                        <p className="text-xs text-muted-foreground">gasto total</p>
                        {cliente.gastoMes > 0 && (
                          <p className="text-xs text-emerald-600">+{formatCurrency(cliente.gastoMes)}</p>
                        )}
                      </div>

                      {/* Cashback + Badge */}
                      <div className="text-center">
                        <p className="font-bold text-base text-amber-500">{formatCurrency(cliente.cashbackDisponivel)}</p>
                        <p className="text-xs text-muted-foreground">cashback</p>
                        <Badge
                          variant={cliente.isActive ? 'default' : 'secondary'}
                          className={`text-[10px] mt-1 ${cliente.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 hover:bg-emerald-100' : ''}`}
                        >
                          {cliente.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>

                      {/* Chevron */}
                      <div className="flex justify-end">
                        {isExpanded
                          ? <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          : <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        }
                      </div>
                    </div>

                    {/* Mobile layout */}
                    <div className="flex flex-col gap-3 sm:hidden">
                      {/* Topo: avatar + info + chevron */}
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${color.bg} ${color.text}`}>
                          {cliente.avatar ? (
                            <img src={cliente.avatar} alt={cliente.name} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            getInitials(cliente.name)
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm truncate">{cliente.name}</p>
                            <Badge
                              variant={cliente.isActive ? 'default' : 'secondary'}
                              className={`text-[10px] flex-shrink-0 ${cliente.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 hover:bg-emerald-100' : ''}`}
                            >
                              {cliente.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{cliente.plan}</p>
                          <p className="text-xs text-muted-foreground">{maskCPF(cliente.cpf)}</p>
                        </div>

                        <div className="flex-shrink-0">
                          {isExpanded
                            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          }
                        </div>
                      </div>

                      {/* 3 mini-stats */}
                      <div className="grid grid-cols-3 divide-x rounded-lg border overflow-hidden">
                        <div className="flex flex-col items-center py-2 px-1">
                          <p className="font-bold text-sm">{cliente.compras}</p>
                          <p className="text-[10px] text-muted-foreground">Compras</p>
                        </div>
                        <div className="flex flex-col items-center py-2 px-1">
                          <p className="font-bold text-sm text-emerald-600 truncate max-w-full text-center">
                            {formatCurrency(cliente.gastoTotal)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Gasto</p>
                        </div>
                        <div className="flex flex-col items-center py-2 px-1">
                          <p className="font-bold text-sm text-amber-500">
                            {formatCurrency(cliente.cashbackDisponivel)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Cashback</p>
                        </div>
                      </div>
                    </div>

                  </CardContent>
                </button>

                {/* ── Expanded Area ── */}
                {isExpanded && (
                  <div className="border-t bg-muted/30">
                    <div className="p-4 space-y-4">

                      {/* Cabeçalho expandido */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ${color.bg} ${color.text}`}>
                            {cliente.avatar ? (
                              <img src={cliente.avatar} alt={cliente.name} className="h-12 w-12 rounded-full object-cover" />
                            ) : (
                              getInitials(cliente.name)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{cliente.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{cliente.email}</p>
                            <p className="text-xs text-muted-foreground">{cliente.plan}</p>
                          </div>
                        </div>

                        {cliente.phone && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleWhatsApp(cliente)
                            }}
                          >
                            <MessageCircle className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </Button>
                        )}
                      </div>

                      {/* 4 Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="rounded-lg bg-background border p-3 text-center">
                          <ShoppingCart className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                          <p className="font-bold text-lg">{cliente.compras}</p>
                          <p className="text-xs text-muted-foreground">Total Compras</p>
                        </div>
                        <div className="rounded-lg bg-background border p-3 text-center">
                          <DollarSign className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                          <p className="font-bold text-lg text-emerald-600">{formatCurrency(cliente.gastoTotal)}</p>
                          <p className="text-xs text-muted-foreground">Gasto Total</p>
                        </div>
                        <div className="rounded-lg bg-background border p-3 text-center">
                          <Gift className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                          <p className="font-bold text-lg text-amber-500">{formatCurrency(cliente.cashbackAcumulado)}</p>
                          <p className="text-xs text-muted-foreground">CB Acumulado</p>
                        </div>
                        <div className="rounded-lg bg-background border p-3 text-center">
                          <Receipt className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                          <p className="font-bold text-base">{formatDate(cliente.ultimaCompra)}</p>
                          <p className="text-xs text-muted-foreground">Última Compra</p>
                        </div>
                      </div>

                      {/* Contato */}
                      {cliente.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{cliente.phone}</span>
                        </div>
                      )}

                      {/* Últimas transações */}
                      {cliente.transactions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Últimas transações
                          </p>
                          <div className="space-y-1.5">
                            {cliente.transactions.map((tx) => {
                              const isPurchase = tx.type === 'PURCHASE'
                              return (
                                <div
                                  key={tx.id}
                                  className="flex items-center justify-between gap-2 rounded-lg bg-background border p-2.5"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`p-1.5 rounded ${isPurchase ? 'bg-blue-50 dark:bg-blue-950' : 'bg-amber-50 dark:bg-amber-950'}`}>
                                      {isPurchase
                                        ? <ShoppingCart className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                        : <Gift className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                                      }
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium truncate">{tx.description || (isPurchase ? 'Compra' : tx.type)}</p>
                                      <p className="text-[10px] text-muted-foreground">{formatDateTime(tx.createdAt)}</p>
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-xs font-bold">{formatCurrency(tx.amount)}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {tx.discountApplied > 0 && `Desc: -${formatCurrency(tx.discountApplied)} `}
                                      {tx.cashbackGenerated > 0 && `CB: +${formatCurrency(tx.cashbackGenerated)}`}
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </Card>
            )
          })}

          {/* Contador */}
          <p className="text-xs text-muted-foreground text-center py-1">
            Exibindo {filteredClientes.length} de {clientes.length} clientes
          </p>
        </div>
      )}
    </div>
  )
}
