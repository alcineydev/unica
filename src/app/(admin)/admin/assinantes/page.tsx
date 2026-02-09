'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  User,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  CreditCard,
  Star,
  PauseCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { AdvancedFilters, FilterConfig } from '@/components/admin/filters'
import { BulkActionsToolbar, BulkAction } from '@/components/admin/bulk-actions'

// Tipos
interface Plan {
  id: string
  name: string
}

interface City {
  id: string
  name: string
}

interface Assinante {
  id: string
  name: string
  cpf: string
  phone?: string
  subscriptionStatus: string
  points: number
  cashback: number
  plan?: Plan
  city?: City
  user?: {
    email: string
    image?: string
  }
  createdAt: string
}

// Status de assinatura
const SUBSCRIPTION_STATUS = [
  { value: 'PENDING', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ACTIVE', label: 'Ativo', color: 'bg-green-100 text-green-800' },
  { value: 'INACTIVE', label: 'Inativo', color: 'bg-gray-100 text-gray-800' },
  { value: 'SUSPENDED', label: 'Suspenso', color: 'bg-orange-100 text-orange-800' },
  { value: 'CANCELED', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  { value: 'EXPIRED', label: 'Expirado', color: 'bg-purple-100 text-purple-800' },
  { value: 'GUEST', label: 'Convidado', color: 'bg-blue-100 text-blue-800' },
]

export default function AssinantesPage() {
  // Estados de dados
  const [assinantes, setAssinantes] = useState<Assinante[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Estados de filtros
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: 'all',
    plan: 'all',
    city: 'all'
  })

  // Estados de seleção
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Buscar dados
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [assinantesRes, plansRes, citiesRes] = await Promise.all([
        fetch('/api/admin/assinantes'),
        fetch('/api/admin/planos'),
        fetch('/api/admin/cities')
      ])

      if (assinantesRes.ok) {
        const data = await assinantesRes.json()
        setAssinantes(Array.isArray(data) ? data : data.assinantes || [])
      }

      if (plansRes.ok) {
        const data = await plansRes.json()
        setPlans(Array.isArray(data) ? data : data.plans || [])
      }

      if (citiesRes.ok) {
        const data = await citiesRes.json()
        setCities(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar assinantes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Configuração dos filtros
  const filtersConfig: FilterConfig[] = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      placeholder: 'Todos os status',
      options: SUBSCRIPTION_STATUS.map(s => ({ value: s.value, label: s.label }))
    },
    {
      id: 'plan',
      label: 'Plano',
      type: 'select',
      placeholder: 'Todos os planos',
      options: plans.map(plan => ({ value: plan.id, label: plan.name }))
    },
    {
      id: 'city',
      label: 'Cidade',
      type: 'select',
      placeholder: 'Todas as cidades',
      options: cities.map(city => ({ value: city.id, label: city.name }))
    }
  ], [plans, cities])

  // Filtrar assinantes
  const filteredAssinantes = useMemo(() => {
    return assinantes.filter(assinante => {
      // Busca
      const searchLower = search.toLowerCase()
      const matchesSearch = !search ||
        assinante.name?.toLowerCase().includes(searchLower) ||
        assinante.cpf?.includes(search) ||
        assinante.user?.email?.toLowerCase().includes(searchLower) ||
        assinante.phone?.includes(search)

      // Status
      const matchesStatus = filterValues.status === 'all' ||
        assinante.subscriptionStatus === filterValues.status

      // Plano
      const matchesPlan = filterValues.plan === 'all' ||
        assinante.plan?.id === filterValues.plan

      // Cidade
      const matchesCity = filterValues.city === 'all' ||
        assinante.city?.id === filterValues.city

      return matchesSearch && matchesStatus && matchesPlan && matchesCity
    })
  }, [assinantes, search, filterValues])

  // Handlers de filtro
  const handleFilterChange = (filterId: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [filterId]: value }))
    setSelectedIds([])
  }

  const handleClearFilters = () => {
    setSearch('')
    setFilterValues({
      status: 'all',
      plan: 'all',
      city: 'all'
    })
    setSelectedIds([])
  }

  // Handlers de seleção
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredAssinantes.map(a => a.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id))
    }
  }

  const isAllSelected = filteredAssinantes.length > 0 &&
    selectedIds.length === filteredAssinantes.length

  const isIndeterminate = selectedIds.length > 0 &&
    selectedIds.length < filteredAssinantes.length

  // Ações em lote
  const handleBulkAction = async (action: string, ids: string[], extraData?: Record<string, any>) => {
    try {
      setActionLoading(true)
      const response = await fetch('/api/admin/assinantes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids, ...extraData })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao executar ação')
      }

      toast.success(data.message)
      fetchData()
      setSelectedIds([])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao executar ação')
      throw error
    } finally {
      setActionLoading(false)
    }
  }

  const bulkActions: BulkAction[] = [
    {
      id: 'activate',
      label: 'Ativar',
      icon: <CheckCircle className="h-4 w-4" />,
      onClick: (ids) => handleBulkAction('activate', ids)
    },
    {
      id: 'deactivate',
      label: 'Desativar',
      icon: <XCircle className="h-4 w-4" />,
      onClick: (ids) => handleBulkAction('deactivate', ids)
    },
    {
      id: 'suspend',
      label: 'Suspender',
      icon: <PauseCircle className="h-4 w-4" />,
      onClick: (ids) => handleBulkAction('suspend', ids)
    },
    {
      id: 'delete',
      label: 'Excluir',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      requiresConfirmation: true,
      onClick: (ids) => handleBulkAction('delete', ids)
    }
  ]

  // Ações individuais
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este assinante?')) return

    try {
      const response = await fetch(`/api/admin/assinantes/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erro ao excluir')

      toast.success('Assinante excluído')
      fetchData()
    } catch (error) {
      toast.error('Erro ao excluir assinante')
    }
  }

  // Obter status formatado
  const getStatusBadge = (status: string) => {
    const statusConfig = SUBSCRIPTION_STATUS.find(s => s.value === status)
    return (
      <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
        {statusConfig?.label || status}
      </Badge>
    )
  }

  // Formatar CPF
  const formatCPF = (cpf: string) => {
    if (!cpf) return ''
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  // Items selecionados
  const selectedItems = filteredAssinantes
    .filter(a => selectedIds.includes(a.id))
    .map(a => ({ id: a.id, name: a.name }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Assinantes</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os assinantes do clube
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/assinantes/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Assinante
          </Link>
        </Button>
      </div>

      {/* Toolbar de ações em lote */}
      <BulkActionsToolbar
        selectedIds={selectedIds}
        selectedItems={selectedItems}
        onClearSelection={() => setSelectedIds([])}
        itemType="assinantes"
        actions={bulkActions}
        isLoading={actionLoading}
      />

      {/* Filtros */}
      <AdvancedFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome, CPF, email ou telefone..."
        filters={filtersConfig}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        totalResults={assinantes.length}
        filteredResults={filteredAssinantes.length}
      />

      {/* Lista vazia */}
      {filteredAssinantes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhum assinante encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {assinantes.length === 0
                ? 'Comece adicionando seu primeiro assinante.'
                : 'Tente ajustar os filtros para encontrar o que procura.'}
            </p>
            {assinantes.length === 0 && (
              <Button asChild>
                <Link href="/admin/assinantes/novo">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Assinante
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabela Desktop */}
      {filteredAssinantes.length > 0 && (
        <div className="hidden md:block">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) (el as any).indeterminate = isIndeterminate
                      }}
                      onCheckedChange={handleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Assinante</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssinantes.map((assinante) => (
                  <TableRow
                    key={assinante.id}
                    className={selectedIds.includes(assinante.id) ? 'bg-blue-50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(assinante.id)}
                        onCheckedChange={(checked) => handleSelectItem(assinante.id, checked === true)}
                        aria-label={`Selecionar ${assinante.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {assinante.user?.image ? (
                          <Image
                            src={assinante.user.image}
                            alt={assinante.name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{assinante.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCPF(assinante.cpf)} • {assinante.user?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {assinante.plan ? (
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3 text-muted-foreground" />
                          {assinante.plan.name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {assinante.city ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {assinante.city.name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {assinante.points || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(assinante.subscriptionStatus)}
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
                            <Link href={`/admin/assinantes/${assinante.id}`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(assinante.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Cards Mobile */}
      {filteredAssinantes.length > 0 && (
        <div className="md:hidden space-y-3">
          {/* Selecionar todos mobile */}
          <Card className="p-3">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isAllSelected}
                ref={(el) => {
                  if (el) (el as any).indeterminate = isIndeterminate
                }}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Selecionar todos ({filteredAssinantes.length})
              </span>
            </div>
          </Card>

          {filteredAssinantes.map((assinante) => (
            <Card
              key={assinante.id}
              className={selectedIds.includes(assinante.id) ? 'border-blue-500 bg-blue-50' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.includes(assinante.id)}
                    onCheckedChange={(checked) => handleSelectItem(assinante.id, checked === true)}
                    className="mt-1"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {assinante.user?.image ? (
                          <Image
                            src={assinante.user.image}
                            alt={assinante.name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{assinante.name}</p>
                          <p className="text-sm text-muted-foreground">{formatCPF(assinante.cpf)}</p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/assinantes/${assinante.id}`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(assinante.id)}
                            className="text-red-600"
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {assinante.plan && (
                        <Badge variant="outline" className="text-xs">
                          <CreditCard className="h-3 w-3 mr-1" />
                          {assinante.plan.name}
                        </Badge>
                      )}
                      {assinante.city && (
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {assinante.city.name}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1 text-yellow-500" />
                        {assinante.points || 0} pts
                      </Badge>
                      {getStatusBadge(assinante.subscriptionStatus)}
                    </div>

                    {assinante.user?.email && (
                      <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {assinante.user.email}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
