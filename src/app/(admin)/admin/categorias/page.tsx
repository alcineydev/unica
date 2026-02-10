'use client'

import { useState, useEffect, useCallback } from 'react'
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
  FolderOpen,
  Search,
  X,
  CheckCircle,
  XCircle,
  Filter,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { BulkActionsToolbar, BulkAction } from '@/components/admin/bulk-actions/bulk-actions-toolbar'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  banner: string
  description: string | null
  displayOrder: number
  isActive: boolean
  _count?: {
    parceiros: number
  }
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Estados de seleção
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Função para verificar se é URL válida
  const isValidImageUrl = (url?: string) => {
    if (!url) return false
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')
  }

  // Carregar categorias
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/categories?includeInactive=true')

      if (response.ok) {
        const data = await response.json()
        setCategories(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filtrar categorias
  const filteredCategories = categories.filter(category => {
    // Filtro de busca
    const matchesSearch = search === '' ||
      category.name.toLowerCase().includes(search.toLowerCase()) ||
      category.description?.toLowerCase().includes(search.toLowerCase())

    // Filtro de status
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && category.isActive) ||
      (statusFilter === 'inactive' && !category.isActive)

    return matchesSearch && matchesStatus
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
      setSelectedIds(filteredCategories.map(c => c.id))
    }
    setSelectAll(!selectAll)
  }

  // Limpar seleção quando filtros mudam
  useEffect(() => {
    setSelectedIds([])
    setSelectAll(false)
  }, [search, statusFilter])

  // Ações em lote
  const handleBulkAction = async (action: string) => {
    try {
      const response = await fetch('/api/admin/categories/bulk', {
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
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao excluir')
      }

      toast.success('Categoria excluída com sucesso')
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
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">Gerencie as categorias de parceiros</p>
        </div>
        <Button asChild>
          <Link href="/admin/categorias/novo">
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Link>
        </Button>
      </div>

      {/* Toolbar de Ações em Lote */}
      <BulkActionsToolbar
        selectedIds={selectedIds}
        actions={bulkActions}
        itemType="categoria"
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
                    }}
                  >
                    Limpar filtros
                  </Button>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredCategories.length} de {categories.length} categoria(s)
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
                    checked={selectAll && filteredCategories.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todas"
                  />
                </TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Parceiros</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => (
                  <TableRow
                    key={category.id}
                    className={selectedIds.includes(category.id) ? 'bg-blue-50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(category.id)}
                        onCheckedChange={() => toggleSelect(category.id)}
                        aria-label={`Selecionar ${category.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {isValidImageUrl(category.banner) ? (
                          <Image
                            src={category.banner}
                            alt={category.name}
                            width={40}
                            height={40}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <FolderOpen className="h-5 w-5 text-purple-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{category.name}</p>
                          {category.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{category._count?.parceiros || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={category.isActive ? 'default' : 'secondary'}
                        className={category.isActive ? 'bg-green-100 text-green-800' : ''}
                      >
                        {category.isActive ? 'Ativa' : 'Inativa'}
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
                            <Link href={`/admin/categorias/${category.id}`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(category.id)}
                            className="text-red-600"
                            disabled={(category._count?.parceiros || 0) > 0}
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
                checked={selectAll && filteredCategories.length > 0}
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

        {filteredCategories.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
            </CardContent>
          </Card>
        ) : (
          filteredCategories.map((category) => (
            <Card
              key={category.id}
              className={`cursor-pointer transition-colors ${selectedIds.includes(category.id) ? 'bg-blue-50 border-blue-200' : ''
                }`}
              onClick={() => toggleSelect(category.id)}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.includes(category.id)}
                    onCheckedChange={() => toggleSelect(category.id)}
                    onClick={(e) => e.stopPropagation()}
                  />

                  {isValidImageUrl(category.banner) ? (
                    <Image
                      src={category.banner}
                      alt={category.name}
                      width={48}
                      height={48}
                      className="rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="h-6 w-6 text-purple-600" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium truncate">{category.name}</h3>
                      <Badge
                        variant={category.isActive ? 'default' : 'secondary'}
                        className={category.isActive ? 'bg-green-100 text-green-800' : ''}
                      >
                        {category.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>

                    {category.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {category.description}
                      </p>
                    )}

                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{category._count?.parceiros || 0} parceiros</span>
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
                        <Link href={`/admin/categorias/${category.id}`}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(category.id)
                        }}
                        className="text-red-600"
                        disabled={(category._count?.parceiros || 0) > 0}
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
