'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  CreditCard,
  Search,
  X,
  CheckCircle,
  XCircle,
  Copy,
  Users,
  Filter,
  Gift,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { BulkActionsToolbar, BulkAction } from '@/components/admin/bulk-actions/bulk-actions-toolbar'

interface PlanBenefit {
  benefit: {
    id: string
    name: string
    type: string
    value: Record<string, unknown>
  }
}

interface Plan {
  id: string
  name: string
  description?: string
  price: number
  priceYearly?: number
  priceSingle?: number
  isActive: boolean
  slug: string
  planBenefits: PlanBenefit[]
  _count?: {
    assinantes: number
  }
}

export default function PlanosPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')

  // Estados de seleção
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Carregar planos
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/plans?includeInactive=true')
      if (response.ok) {
        const data = await response.json()
        setPlans(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      toast.error('Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  // Filtrar planos
  const filteredPlans = plans.filter(plan => {
    // Filtro de busca
    const matchesSearch = search === '' ||
      plan.name.toLowerCase().includes(search.toLowerCase()) ||
      plan.description?.toLowerCase().includes(search.toLowerCase())

    // Filtro de status
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && plan.isActive) ||
      (statusFilter === 'inactive' && !plan.isActive)

    // Filtro de tipo de preço
    const matchesPrice = priceFilter === 'all' ||
      (priceFilter === 'free' && plan.price === 0) ||
      (priceFilter === 'paid' && plan.price > 0) ||
      (priceFilter === 'yearly' && plan.priceYearly && plan.priceYearly > 0) ||
      (priceFilter === 'single' && plan.priceSingle && plan.priceSingle > 0)

    return matchesSearch && matchesStatus && matchesPrice
  })

  // Handlers de seleção
  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredPlans.map(p => p.id))
    }
    setSelectAll(!selectAll)
  }

  // Limpar seleção quando filtros mudam
  useEffect(() => {
    setSelectedIds([])
    setSelectAll(false)
  }, [search, statusFilter, priceFilter])

  // Ações em lote
  const handleBulkAction = async (action: string) => {
    try {
      const response = await fetch('/api/admin/plans/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: selectedIds })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro na operação')
      }

      toast.success(data.message)
      setSelectedIds([])
      setSelectAll(false)
      fetchPlans()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro na operação')
    }
  }

  // Excluir individual
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return

    try {
      const response = await fetch(`/api/admin/plans/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao excluir')
      }

      toast.success('Plano excluído com sucesso')
      fetchPlans()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir')
    }
  }

  // Formatador de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Definir ações em lote
  const bulkActions: BulkAction[] = [
    {
      id: 'activate',
      label: 'Ativar',
      icon: <CheckCircle className="h-4 w-4" />,
      variant: 'success',
      onClick: async () => { await handleBulkAction('activate') }
    },
    {
      id: 'deactivate',
      label: 'Desativar',
      icon: <XCircle className="h-4 w-4" />,
      variant: 'warning',
      onClick: async () => { await handleBulkAction('deactivate') }
    },
    {
      id: 'duplicate',
      label: 'Duplicar',
      icon: <Copy className="h-4 w-4" />,
      variant: 'default',
      onClick: async () => { await handleBulkAction('duplicate') }
    },
    {
      id: 'delete',
      label: 'Excluir',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      requiresConfirmation: true,
      onClick: async () => { await handleBulkAction('delete') }
    }
  ]

  // Contar filtros ativos
  const activeFiltersCount = [
    statusFilter !== 'all',
    priceFilter !== 'all',
    search !== ''
  ].filter(Boolean).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Planos</h1>
          <p className="text-muted-foreground">Gerencie os planos de assinatura</p>
        </div>
        <Button asChild>
          <Link href="/admin/planos?action=create">
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Link>
        </Button>
      </div>

      {/* Toolbar de Ações em Lote */}
      <BulkActionsToolbar
        selectedIds={selectedIds}
        actions={bulkActions}
        itemType="plano"
        onClearSelection={() => { setSelectedIds([]); setSelectAll(false) }}
      />

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearch('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filtro de Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de Preço */}
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo de Preço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="free">Gratuito</SelectItem>
                <SelectItem value="paid">Pago (Mensal)</SelectItem>
                <SelectItem value="yearly">Com Anual</SelectItem>
                <SelectItem value="single">Com Único</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resumo de filtros */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <>
                  <Badge variant="secondary">
                    <Filter className="h-3 w-3 mr-1" />
                    {activeFiltersCount} filtro(s)
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearch('')
                      setStatusFilter('all')
                      setPriceFilter('all')
                    }}
                  >
                    Limpar filtros
                  </Button>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredPlans.length} de {plans.length} plano(s)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Desktop */}
      <div className="hidden md:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectAll && filteredPlans.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Preço Mensal</TableHead>
                <TableHead>Preço Anual</TableHead>
                <TableHead className="text-center">Assinantes</TableHead>
                <TableHead className="text-center">Benefícios</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhum plano encontrado</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map((plan) => (
                  <TableRow
                    key={plan.id}
                    className={selectedIds.includes(plan.id) ? 'bg-blue-50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(plan.id)}
                        onCheckedChange={() => toggleSelect(plan.id)}
                        aria-label={`Selecionar ${plan.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        {plan.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {plan.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {plan.price === 0 ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Gratuito
                        </Badge>
                      ) : (
                        <span className="font-medium">{formatCurrency(plan.price)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {plan.priceYearly && plan.priceYearly > 0 ? (
                        <span className="text-sm">{formatCurrency(plan.priceYearly)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{plan._count?.assinantes || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Gift className="h-4 w-4 text-muted-foreground" />
                        <span>{plan.planBenefits?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={plan.isActive ? 'default' : 'secondary'}
                        className={plan.isActive ? 'bg-green-100 text-green-800' : ''}
                      >
                        {plan.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              const checkoutUrl = `${window.location.origin}/checkout/${plan.slug || plan.id}`
                              navigator.clipboard.writeText(checkoutUrl)
                              toast.success('Link copiado!')
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar Link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const checkoutUrl = `${window.location.origin}/checkout/${plan.slug || plan.id}`
                              window.open(checkoutUrl, '_blank')
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir Checkout
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/planos/${plan.id}`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              setSelectedIds([plan.id])
                              await handleBulkAction('duplicate')
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(plan.id)}
                            className="text-red-600"
                            disabled={(plan._count?.assinantes || 0) > 0}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Cards Mobile */}
      <div className="md:hidden space-y-4">
        {/* Card de Seleção */}
        <Card
          className={`cursor-pointer transition-colors ${selectAll ? 'bg-blue-50 border-blue-200' : ''}`}
          onClick={toggleSelectAll}
        >
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectAll && filteredPlans.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectAll ? 'Desmarcar todos' : 'Selecionar todos'}
              </span>
              {selectedIds.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {selectedIds.length} selecionado(s)
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {filteredPlans.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum plano encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-colors ${selectedIds.includes(plan.id) ? 'bg-blue-50 border-blue-200' : ''
                }`}
              onClick={() => toggleSelect(plan.id)}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.includes(plan.id)}
                    onCheckedChange={() => toggleSelect(plan.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium truncate">{plan.name}</h3>
                      <Badge
                        variant={plan.isActive ? 'default' : 'secondary'}
                        className={plan.isActive ? 'bg-green-100 text-green-800' : ''}
                      >
                        {plan.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {plan.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        {plan.price === 0 ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Gratuito
                          </Badge>
                        ) : (
                          <span className="font-medium">{formatCurrency(plan.price)}/mês</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {plan._count?.assinantes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Gift className="h-4 w-4" />
                          {plan.planBenefits?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/planos/${plan.id}`}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async (e) => {
                          e.stopPropagation()
                          setSelectedIds([plan.id])
                          await handleBulkAction('duplicate')
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(plan.id)
                        }}
                        className="text-red-600"
                        disabled={(plan._count?.assinantes || 0) > 0}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
