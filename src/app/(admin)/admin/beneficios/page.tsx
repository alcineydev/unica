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
  Gift,
  Search,
  X,
  CheckCircle,
  XCircle,
  Filter,
  Percent,
  RefreshCcw,
  Coins,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'
import { BulkActionsToolbar, BulkAction } from '@/components/admin/bulk-actions/bulk-actions-toolbar'
import { BENEFIT_TYPES } from '@/constants'

interface Benefit {
  id: string
  name: string
  description: string
  type: 'DESCONTO' | 'CASHBACK' | 'PONTOS' | 'ACESSO_EXCLUSIVO'
  value: Record<string, unknown>
  category: string | null
  isActive: boolean
  _count?: {
    planBenefits: number
    benefitAccess: number
  }
}

const typeIcons = {
  DESCONTO: Percent,
  CASHBACK: RefreshCcw,
  PONTOS: Coins,
  ACESSO_EXCLUSIVO: Star,
}

const typeColors = {
  DESCONTO: 'bg-blue-500/10 text-blue-500',
  CASHBACK: 'bg-green-500/10 text-green-500',
  PONTOS: 'bg-yellow-500/10 text-yellow-500',
  ACESSO_EXCLUSIVO: 'bg-purple-500/10 text-purple-500',
}

export default function BeneficiosPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Estados de seleção
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Carregar benefícios
  const fetchBenefits = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/benefits?includeInactive=true')
      const result = await response.json()

      if (response.ok) {
        setBenefits(Array.isArray(result) ? result : result.data || [])
      } else {
        toast.error(result.error || 'Erro ao carregar benefícios')
      }
    } catch (error) {
      console.error('Erro ao carregar benefícios:', error)
      toast.error('Erro ao carregar benefícios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBenefits()
  }, [fetchBenefits])

  // Filtrar benefícios
  const filteredBenefits = benefits.filter(benefit => {
    // Filtro de busca
    const matchesSearch = search === '' ||
      benefit.name.toLowerCase().includes(search.toLowerCase()) ||
      benefit.description?.toLowerCase().includes(search.toLowerCase())

    // Filtro de status
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && benefit.isActive) ||
      (statusFilter === 'inactive' && !benefit.isActive)

    // Filtro de tipo
    const matchesType = typeFilter === 'all' ||
      benefit.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
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
      setSelectedIds(filteredBenefits.map(b => b.id))
    }
    setSelectAll(!selectAll)
  }

  // Limpar seleção quando filtros mudam
  useEffect(() => {
    setSelectedIds([])
    setSelectAll(false)
  }, [search, statusFilter, typeFilter])

  // Ações em lote
  const handleBulkAction = async (action: string) => {
    try {
      const response = await fetch('/api/admin/benefits/bulk', {
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
      fetchBenefits()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro na operação')
    }
  }

  // Excluir individual
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este benefício?')) return

    try {
      const response = await fetch(`/api/admin/benefits/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao excluir')
      }

      toast.success('Benefício excluído com sucesso')
      fetchBenefits()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir')
    }
  }

  // Formatador de valor
  function formatValue(benefit: Benefit): string {
    const value = benefit.value as Record<string, number | string>
    switch (benefit.type) {
      case 'DESCONTO':
      case 'CASHBACK':
        return `${value.percentage}%`
      case 'PONTOS':
        return `${value.monthlyPoints} pts/mês`
      case 'ACESSO_EXCLUSIVO':
        return 'Premium'
      default:
        return '-'
    }
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
    typeFilter !== 'all',
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
          <h1 className="text-2xl font-bold">Benefícios</h1>
          <p className="text-muted-foreground">Gerencie os benefícios do clube</p>
        </div>
        <Button asChild>
          <Link href="/admin/beneficios/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Benefício
          </Link>
        </Button>
      </div>

      {/* Toolbar de Ações em Lote */}
      <BulkActionsToolbar
        selectedIds={selectedIds}
        actions={bulkActions}
        itemType="benefício"
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
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de Tipo */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(BENEFIT_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
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
                      setTypeFilter('all')
                    }}
                  >
                    Limpar filtros
                  </Button>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredBenefits.length} de {benefits.length} benefício(s)
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
                    checked={selectAll && filteredBenefits.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                <TableHead>Benefício</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-center">Planos</TableHead>
                <TableHead className="text-center">Parceiros</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBenefits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhum benefício encontrado</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBenefits.map((benefit) => {
                  const Icon = typeIcons[benefit.type]
                  return (
                    <TableRow
                      key={benefit.id}
                      className={selectedIds.includes(benefit.id) ? 'bg-blue-50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(benefit.id)}
                          onCheckedChange={() => toggleSelect(benefit.id)}
                          aria-label={`Selecionar ${benefit.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{benefit.name}</p>
                          {benefit.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {benefit.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${typeColors[benefit.type]}`}>
                          <Icon className="h-3 w-3" />
                          {BENEFIT_TYPES[benefit.type].label}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">
                          {formatValue(benefit)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {benefit._count?.planBenefits || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {benefit._count?.benefitAccess || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={benefit.isActive ? 'default' : 'secondary'}
                          className={benefit.isActive ? 'bg-green-100 text-green-800' : ''}
                        >
                          {benefit.isActive ? 'Ativo' : 'Inativo'}
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
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/beneficios/${benefit.id}`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(benefit.id)}
                              className="text-red-600"
                              disabled={(benefit._count?.planBenefits || 0) > 0 || (benefit._count?.benefitAccess || 0) > 0}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
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
                checked={selectAll && filteredBenefits.length > 0}
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

        {filteredBenefits.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum benefício encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredBenefits.map((benefit) => {
            const Icon = typeIcons[benefit.type]
            return (
              <Card
                key={benefit.id}
                className={`cursor-pointer transition-colors ${selectedIds.includes(benefit.id) ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                onClick={() => toggleSelect(benefit.id)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.includes(benefit.id)}
                      onCheckedChange={() => toggleSelect(benefit.id)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    <div className={`p-2 rounded-lg flex-shrink-0 ${typeColors[benefit.type]}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium truncate">{benefit.name}</h3>
                        <Badge
                          variant={benefit.isActive ? 'default' : 'secondary'}
                          className={benefit.isActive ? 'bg-green-100 text-green-800' : ''}
                        >
                          {benefit.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>

                      {benefit.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {benefit.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {BENEFIT_TYPES[benefit.type].label}
                        </Badge>
                        <span className="font-medium text-green-600">
                          {formatValue(benefit)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                        <span>{benefit._count?.planBenefits || 0} planos</span>
                        <span>•</span>
                        <span>{benefit._count?.benefitAccess || 0} parceiros</span>
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
                          <Link href={`/admin/beneficios/${benefit.id}`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(benefit.id)
                          }}
                          className="text-red-600"
                          disabled={(benefit._count?.planBenefits || 0) > 0 || (benefit._count?.benefitAccess || 0) > 0}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
