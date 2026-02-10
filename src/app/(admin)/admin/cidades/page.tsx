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
  MapPin,
  Search,
  X,
  CheckCircle,
  XCircle,
  Filter,
  Users,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { BulkActionsToolbar, BulkAction } from '@/components/admin/bulk-actions/bulk-actions-toolbar'

interface City {
  id: string
  name: string
  state: string
  isActive: boolean
  _count?: {
    assinantes: number
    parceiros: number
  }
}

export default function CidadesPage() {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')

  // Estados de seleção
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Carregar cidades
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/cities?includeInactive=true')

      if (response.ok) {
        const result = await response.json()
        setCities(Array.isArray(result) ? result : result.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar cidades:', error)
      toast.error('Erro ao carregar cidades')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Obter estados únicos das cidades carregadas
  const uniqueStates = [...new Set(cities.map(c => c.state))].sort()

  // Filtrar cidades
  const filteredCities = cities.filter(city => {
    // Filtro de busca
    const matchesSearch = search === '' ||
      city.name.toLowerCase().includes(search.toLowerCase()) ||
      city.state.toLowerCase().includes(search.toLowerCase())

    // Filtro de status
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && city.isActive) ||
      (statusFilter === 'inactive' && !city.isActive)

    // Filtro de estado
    const matchesState = stateFilter === 'all' || city.state === stateFilter

    return matchesSearch && matchesStatus && matchesState
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
      setSelectedIds(filteredCities.map(c => c.id))
    }
    setSelectAll(!selectAll)
  }

  // Limpar seleção quando filtros mudam
  useEffect(() => {
    setSelectedIds([])
    setSelectAll(false)
  }, [search, statusFilter, stateFilter])

  // Ações em lote
  const handleBulkAction = async (action: string) => {
    try {
      const response = await fetch('/api/admin/cities/bulk', {
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
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro na operação')
    }
  }

  // Excluir individual
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta cidade?')) return

    try {
      const response = await fetch(`/api/admin/cities/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao excluir')
      }

      toast.success('Cidade excluída com sucesso')
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir')
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
    stateFilter !== 'all',
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
          <h1 className="text-2xl font-bold">Cidades</h1>
          <p className="text-muted-foreground">Gerencie as cidades de atuação</p>
        </div>
        <Button asChild>
          <Link href="/admin/cidades/novo">
            <Plus className="h-4 w-4 mr-2" />
            Nova Cidade
          </Link>
        </Button>
      </div>

      {/* Toolbar de Ações em Lote */}
      <BulkActionsToolbar
        selectedIds={selectedIds}
        actions={bulkActions}
        itemType="cidade"
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
                placeholder="Buscar por nome ou estado..."
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

            {/* Filtro de Estado */}
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {uniqueStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro de Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
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
                      setStateFilter('all')
                    }}
                  >
                    Limpar filtros
                  </Button>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredCities.length} de {cities.length} cidade(s)
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
                    checked={selectAll && filteredCities.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todas"
                  />
                </TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Assinantes</TableHead>
                <TableHead className="text-center">Parceiros</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhuma cidade encontrada</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCities.map((city) => (
                  <TableRow
                    key={city.id}
                    className={selectedIds.includes(city.id) ? 'bg-blue-50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(city.id)}
                        onCheckedChange={() => toggleSelect(city.id)}
                        aria-label={`Selecionar ${city.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="font-medium">{city.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{city.state}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{city._count?.assinantes || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{city._count?.parceiros || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={city.isActive ? 'default' : 'secondary'}
                        className={city.isActive ? 'bg-green-100 text-green-800' : ''}
                      >
                        {city.isActive ? 'Ativa' : 'Inativa'}
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
                            <Link href={`/admin/cidades/${city.id}`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(city.id)}
                            className="text-red-600"
                            disabled={(city._count?.assinantes || 0) > 0 || (city._count?.parceiros || 0) > 0}
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
                checked={selectAll && filteredCities.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectAll ? 'Desmarcar todas' : 'Selecionar todas'}
              </span>
              {selectedIds.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {selectedIds.length} selecionada(s)
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {filteredCities.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhuma cidade encontrada</p>
            </CardContent>
          </Card>
        ) : (
          filteredCities.map((city) => (
            <Card
              key={city.id}
              className={`cursor-pointer transition-colors ${selectedIds.includes(city.id) ? 'bg-blue-50 border-blue-200' : ''
                }`}
              onClick={() => toggleSelect(city.id)}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.includes(city.id)}
                    onCheckedChange={() => toggleSelect(city.id)}
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium truncate">{city.name}</h3>
                      <Badge
                        variant={city.isActive ? 'default' : 'secondary'}
                        className={city.isActive ? 'bg-green-100 text-green-800' : ''}
                      >
                        {city.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant="outline">{city.state}</Badge>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {city._count?.assinantes || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {city._count?.parceiros || 0}
                      </span>
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
                        <Link href={`/admin/cidades/${city.id}`}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(city.id)
                        }}
                        className="text-red-600"
                        disabled={(city._count?.assinantes || 0) > 0 || (city._count?.parceiros || 0) > 0}
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
