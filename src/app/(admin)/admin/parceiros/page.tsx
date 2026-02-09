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
  Building2,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  Store
} from 'lucide-react'
import { toast } from 'sonner'
import { AdvancedFilters, FilterConfig } from '@/components/admin/filters'
import { BulkActionsToolbar, BulkAction } from '@/components/admin/bulk-actions'

// Tipos
interface City {
  id: string
  name: string
}

interface Parceiro {
  id: string
  companyName: string
  tradeName?: string | null
  cnpj: string
  category: string
  isActive: boolean
  logo?: string | null
  city?: City
  contact?: {
    whatsapp?: string
    phone?: string
    email?: string
  }
  user?: {
    email: string
  }
  createdAt: string
}

// Categorias de parceiros
const PARTNER_CATEGORIES = [
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'saude', label: 'Saúde' },
  { value: 'beleza', label: 'Beleza' },
  { value: 'educacao', label: 'Educação' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'comercio', label: 'Comércio' },
  { value: 'lazer', label: 'Lazer' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'outros', label: 'Outros' },
]

export default function ParceirosPage() {
  // Estados de dados
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Estados de filtros
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    category: 'all',
    city: 'all',
    status: 'all'
  })

  // Estados de seleção
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Buscar dados
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [parceirosRes, citiesRes] = await Promise.all([
        fetch('/api/admin/partners?includeInactive=true'),
        fetch('/api/admin/cities')
      ])

      if (parceirosRes.ok) {
        const data = await parceirosRes.json()
        setParceiros(data.data || data)
      }

      if (citiesRes.ok) {
        const data = await citiesRes.json()
        setCities(data.data || data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar parceiros')
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
      options: [
        { value: 'active', label: 'Ativos' },
        { value: 'inactive', label: 'Inativos' }
      ]
    },
    {
      id: 'category',
      label: 'Categoria',
      type: 'select',
      placeholder: 'Todas as categorias',
      options: PARTNER_CATEGORIES
    },
    {
      id: 'city',
      label: 'Cidade',
      type: 'select',
      placeholder: 'Todas as cidades',
      options: cities.map(city => ({ value: city.id, label: city.name }))
    }
  ], [cities])

  // Filtrar parceiros
  const filteredParceiros = useMemo(() => {
    return parceiros.filter(parceiro => {
      // Busca
      const searchLower = search.toLowerCase()
      const matchesSearch = !search || 
        parceiro.companyName?.toLowerCase().includes(searchLower) ||
        parceiro.tradeName?.toLowerCase().includes(searchLower) ||
        parceiro.cnpj?.includes(search)

      // Status
      const matchesStatus = filterValues.status === 'all' || 
        (filterValues.status === 'active' && parceiro.isActive) ||
        (filterValues.status === 'inactive' && !parceiro.isActive)

      // Categoria
      const matchesCategory = filterValues.category === 'all' || 
        parceiro.category === filterValues.category

      // Cidade
      const matchesCity = filterValues.city === 'all' || 
        parceiro.city?.id === filterValues.city

      return matchesSearch && matchesStatus && matchesCategory && matchesCity
    })
  }, [parceiros, search, filterValues])

  // Handlers de filtro
  const handleFilterChange = (filterId: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [filterId]: value }))
    setSelectedIds([]) // Limpar seleção ao mudar filtro
  }

  const handleClearFilters = () => {
    setSearch('')
    setFilterValues({
      category: 'all',
      city: 'all',
      status: 'all'
    })
    setSelectedIds([])
  }

  // Handlers de seleção
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredParceiros.map(p => p.id))
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

  const isAllSelected = filteredParceiros.length > 0 && 
    selectedIds.length === filteredParceiros.length

  const isIndeterminate = selectedIds.length > 0 && 
    selectedIds.length < filteredParceiros.length

  // Ações em lote
  const handleBulkAction = async (action: string, ids: string[]) => {
    try {
      setActionLoading(true)
      const response = await fetch('/api/admin/parceiros/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids })
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
      id: 'delete',
      label: 'Excluir',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      requiresConfirmation: true,
      onClick: (ids) => handleBulkAction('delete', ids)
    }
  ]

  // Ações individuais
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (!response.ok) throw new Error('Erro ao atualizar status')

      toast.success(currentStatus ? 'Parceiro desativado' : 'Parceiro ativado')
      fetchData()
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este parceiro?')) return

    try {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erro ao excluir')

      toast.success('Parceiro excluído')
      fetchData()
    } catch (error) {
      toast.error('Erro ao excluir parceiro')
    }
  }

  // Obter label da categoria
  const getCategoryLabel = (value: string) => {
    return PARTNER_CATEGORIES.find(c => c.value === value)?.label || value
  }

  // Items selecionados (para o modal de exclusão)
  const selectedItems = filteredParceiros
    .filter(p => selectedIds.includes(p.id))
    .map(p => ({ id: p.id, name: p.tradeName || p.companyName }))

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
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Parceiros</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as empresas parceiras do clube
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/parceiros/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Parceiro
          </Link>
        </Button>
      </div>

      {/* Toolbar de ações em lote */}
      <BulkActionsToolbar
        selectedIds={selectedIds}
        selectedItems={selectedItems}
        onClearSelection={() => setSelectedIds([])}
        itemType="parceiros"
        actions={bulkActions}
        isLoading={actionLoading}
      />

      {/* Filtros */}
      <AdvancedFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome, razão social ou CNPJ..."
        filters={filtersConfig}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        totalResults={parceiros.length}
        filteredResults={filteredParceiros.length}
      />

      {/* Lista vazia */}
      {filteredParceiros.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhum parceiro encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {parceiros.length === 0 
                ? 'Comece adicionando seu primeiro parceiro.'
                : 'Tente ajustar os filtros para encontrar o que procura.'}
            </p>
            {parceiros.length === 0 && (
              <Button asChild>
                <Link href="/admin/parceiros/novo">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Parceiro
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabela Desktop */}
      {filteredParceiros.length > 0 && (
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
                  <TableHead>Empresa</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParceiros.map((parceiro) => (
                  <TableRow 
                    key={parceiro.id}
                    className={selectedIds.includes(parceiro.id) ? 'bg-blue-50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(parceiro.id)}
                        onCheckedChange={(checked) => handleSelectItem(parceiro.id, checked === true)}
                        aria-label={`Selecionar ${parceiro.tradeName || parceiro.companyName}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {parceiro.logo ? (
                          <Image
                            src={parceiro.logo}
                            alt={parceiro.tradeName || parceiro.companyName}
                            width={40}
                            height={40}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{parceiro.tradeName || parceiro.companyName}</p>
                          <p className="text-sm text-muted-foreground">{parceiro.cnpj}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryLabel(parceiro.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {parceiro.city && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {parceiro.city.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {parceiro.contact?.whatsapp && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {parceiro.contact.whatsapp}
                          </div>
                        )}
                        {parceiro.user?.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {parceiro.user.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={parceiro.isActive ? 'default' : 'secondary'}>
                        {parceiro.isActive ? 'Ativo' : 'Inativo'}
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
                            <Link href={`/admin/parceiros/${parceiro.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/parceiros/${parceiro.id}/editar`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(parceiro.id, parceiro.isActive)}
                          >
                            {parceiro.isActive ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(parceiro.id)}
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
      {filteredParceiros.length > 0 && (
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
                Selecionar todos ({filteredParceiros.length})
              </span>
            </div>
          </Card>

          {filteredParceiros.map((parceiro) => (
            <Card 
              key={parceiro.id}
              className={selectedIds.includes(parceiro.id) ? 'border-blue-500 bg-blue-50' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.includes(parceiro.id)}
                    onCheckedChange={(checked) => handleSelectItem(parceiro.id, checked === true)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {parceiro.logo ? (
                          <Image
                            src={parceiro.logo}
                            alt={parceiro.tradeName || parceiro.companyName}
                            width={40}
                            height={40}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{parceiro.tradeName || parceiro.companyName}</p>
                          <p className="text-sm text-muted-foreground">{parceiro.cnpj}</p>
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
                            <Link href={`/admin/parceiros/${parceiro.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/parceiros/${parceiro.id}/editar`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(parceiro.id, parceiro.isActive)}
                          >
                            {parceiro.isActive ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(parceiro.id)}
                            className="text-red-600"
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(parceiro.category)}
                      </Badge>
                      {parceiro.city && (
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {parceiro.city.name}
                        </Badge>
                      )}
                      <Badge variant={parceiro.isActive ? 'default' : 'secondary'} className="text-xs">
                        {parceiro.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    {(parceiro.contact?.whatsapp || parceiro.user?.email) && (
                      <div className="mt-3 pt-3 border-t space-y-1 text-sm text-muted-foreground">
                        {parceiro.contact?.whatsapp && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {parceiro.contact.whatsapp}
                          </div>
                        )}
                        {parceiro.user?.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {parceiro.user.email}
                          </div>
                        )}
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
