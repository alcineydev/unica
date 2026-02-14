'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Ban,
  BarChart3,
  RefreshCcw,
  X,
  Crown,
} from 'lucide-react'
import { toast } from 'sonner'
import SubscribersDashboard from './components/subscribers-dashboard'

// ─── Types ───────────────────────────────────────────────

interface Assinante {
  id: string
  name: string
  cpf: string | null
  phone: string | null
  subscriptionStatus: string
  points: number
  cashback: number
  qrCode: string
  createdAt: string
  planId: string | null
  cityId: string | null
  user: {
    id: string
    email: string
    avatar: string | null
    isActive: boolean
    createdAt: string
  }
  plan: {
    id: string
    name: string
    price: number
    period: string
  } | null
  city: {
    id: string
    name: string
    state: string
  } | null
  _count: {
    transactions: number
  }
}

interface Plan {
  id: string
  name: string
  price: number
}

interface City {
  id: string
  name: string
  state: string
}

// ─── Constants ───────────────────────────────────────────

const STATUS_MAP: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  ACTIVE: { label: 'Ativo', variant: 'default' },
  PENDING: { label: 'Pendente', variant: 'secondary' },
  INACTIVE: { label: 'Inativo', variant: 'outline' },
  SUSPENDED: { label: 'Suspenso', variant: 'destructive' },
  CANCELED: { label: 'Cancelado', variant: 'destructive' },
  EXPIRED: { label: 'Expirado', variant: 'outline' },
  GUEST: { label: 'Convidado (legado)', variant: 'secondary' },
}

// ─── Helpers ─────────────────────────────────────────────

function formatCPF(cpf: string | null) {
  if (!cpf) return '—'
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatPhone(phone: string | null) {
  if (!phone) return '—'
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

// ─── Component ───────────────────────────────────────────

export default function AssinantesPage() {
  const [assinantes, setAssinantes] = useState<Assinante[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [dashboardStats, setDashboardStats] = useState<Record<string, unknown> | null>(null)

  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [showDashboard, setShowDashboard] = useState(true)

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    id?: string
    name?: string
  }>({ open: false })

  // ─── Fetch assinantes ──────────────────────────────────

  const fetchAssinantes = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (planFilter !== 'all') params.set('planId', planFilter)
      if (cityFilter !== 'all') params.set('cityId', cityFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/assinantes?${params}`)
      const data = await res.json()
      setAssinantes(Array.isArray(data) ? data : data.data || [])
    } catch {
      toast.error('Erro ao carregar assinantes')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, planFilter, cityFilter])

  // ─── Fetch auxiliares ──────────────────────────────────

  const fetchAuxData = useCallback(async () => {
    try {
      const [plansRes, citiesRes] = await Promise.all([
        fetch('/api/admin/plans'),
        fetch('/api/admin/cities'),
      ])
      const [plansData, citiesData] = await Promise.all([
        plansRes.json(),
        citiesRes.json(),
      ])
      setPlans(Array.isArray(plansData) ? plansData : plansData.data || [])
      setCities(
        Array.isArray(citiesData) ? citiesData : citiesData.data || []
      )
    } catch (error) {
      console.error('Erro ao carregar dados auxiliares:', error)
    }
  }, [])

  // ─── Fetch stats ───────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const res = await fetch('/api/admin/assinantes/stats')
      const data = await res.json()
      setDashboardStats(data)
    } catch (error) {
      console.error('Erro ao carregar stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAuxData()
    fetchStats()
  }, [fetchAuxData, fetchStats])

  useEffect(() => {
    const debounce = setTimeout(
      () => {
        fetchAssinantes()
      },
      search ? 400 : 0
    )
    return () => clearTimeout(debounce)
  }, [fetchAssinantes, search])

  // ─── Dados filtrados ───────────────────────────────────

  const filtered = useMemo(() => assinantes, [assinantes])

  // ─── Seleção ───────────────────────────────────────────

  const allSelected =
    filtered.length > 0 && selectedIds.length === filtered.length
  const someSelected = selectedIds.length > 0

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map((a) => a.id))
    }
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // ─── Bulk actions ──────────────────────────────────────

  const bulkAction = async (action: string) => {
    if (selectedIds.length === 0) return

    try {
      const res = await fetch('/api/admin/assinantes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: selectedIds }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro na ação em lote')
      }

      const data = await res.json()
      toast.success(
        data.message || `Ação realizada em ${selectedIds.length} assinante(s)`
      )
      setSelectedIds([])
      fetchAssinantes()
      fetchStats()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro na ação em lote'
      )
    }
  }

  // ─── Delete ────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/assinantes/${id}?force=true`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success('Assinante excluído')
      fetchAssinantes()
      fetchStats()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao excluir'
      )
    } finally {
      setDeleteDialog({ open: false })
    }
  }

  // ─── Toggle status ─────────────────────────────────────

  const toggleStatus = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/assinantes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !currentActive,
          subscriptionStatus: !currentActive ? 'ACTIVE' : 'INACTIVE',
        }),
      })
      if (!res.ok) throw new Error('Erro ao alterar status')
      toast.success(
        !currentActive ? 'Assinante ativado' : 'Assinante desativado'
      )
      fetchAssinantes()
      fetchStats()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao alterar status'
      )
    }
  }

  // ─── Filters ───────────────────────────────────────────

  const hasActiveFilters =
    statusFilter !== 'all' ||
    planFilter !== 'all' ||
    cityFilter !== 'all' ||
    search !== ''

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPlanFilter('all')
    setCityFilter('all')
  }

  // ─── Render ────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Assinantes
          </h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} assinante{filtered.length !== 1 ? 's' : ''}{' '}
            encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDashboard(!showDashboard)}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            {showDashboard ? 'Ocultar' : 'Mostrar'} Dashboard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchAssinantes()
              fetchStats()
            }}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/assinantes/novo">
              <UserPlus className="h-4 w-4 mr-1" />
              Novo Assinante
            </Link>
          </Button>
        </div>
      </div>

      {/* Dashboard */}
      {showDashboard && (
        <SubscribersDashboard stats={dashboardStats as any} loading={statsLoading} />
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, CPF, telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36 h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {Object.entries(STATUS_MAP).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-40 h-9">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Planos</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full sm:w-40 h-9">
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Cidades</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name} - {city.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {someSelected && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">
                {selectedIds.length} selecionado(s)
              </span>
              <div className="flex gap-1.5 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkAction('activate')}
                >
                  <UserCheck className="h-3.5 w-3.5 mr-1" /> Ativar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkAction('deactivate')}
                >
                  <UserX className="h-3.5 w-3.5 mr-1" /> Desativar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkAction('suspend')}
                >
                  <Ban className="h-3.5 w-3.5 mr-1" /> Suspender
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => bulkAction('delete')}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela Desktop */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">
                  Nenhum assinante encontrado
                </p>
                <p className="text-sm">
                  Tente ajustar os filtros ou criar um novo assinante.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Assinante</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Trans.</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((assinante) => {
                    const statusInfo = STATUS_MAP[
                      assinante.subscriptionStatus
                    ] || {
                      label: assinante.subscriptionStatus,
                      variant: 'outline' as const,
                    }
                    const isSelected = selectedIds.includes(assinante.id)

                    return (
                      <TableRow
                        key={assinante.id}
                        className={isSelected ? 'bg-primary/5' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleOne(assinante.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-muted shrink-0">
                              {assinante.user?.avatar ? (
                                <Image
                                  src={assinante.user.avatar}
                                  alt={assinante.name}
                                  width={36}
                                  height={36}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                                  {assinante.name?.charAt(0)?.toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {assinante.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {assinante.user?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{formatPhone(assinante.phone)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCPF(assinante.cpf)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {assinante.plan ? (
                            <Badge variant="secondary" className="text-xs">
                              {assinante.plan.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Sem plano
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {assinante.city
                              ? assinante.city.name
                              : '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusInfo.variant}
                            className="text-[10px]"
                          >
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm">
                            {assinante._count?.transactions || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/assinantes/${assinante.id}`}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />{' '}
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleStatus(
                                    assinante.id,
                                    assinante.user?.isActive !== false
                                  )
                                }
                              >
                                {assinante.user?.isActive !== false ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />{' '}
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />{' '}
                                    Ativar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  setDeleteDialog({
                                    open: true,
                                    id: assinante.id,
                                    name: assinante.name,
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4 mr-2" />{' '}
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cards Mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Nenhum assinante encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((assinante) => {
            const statusInfo = STATUS_MAP[
              assinante.subscriptionStatus
            ] || {
              label: assinante.subscriptionStatus,
              variant: 'outline' as const,
            }
            const isSelected = selectedIds.includes(assinante.id)

            return (
              <Card
                key={assinante.id}
                className={
                  isSelected ? 'border-primary/50 bg-primary/5' : ''
                }
              >
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(assinante.id)}
                      />
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0">
                        {assinante.user?.avatar ? (
                          <Image
                            src={assinante.user.avatar}
                            alt={assinante.name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                            {assinante.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm truncate">
                            {assinante.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {assinante.user?.email}
                          </p>
                        </div>
                        <Badge
                          variant={statusInfo.variant}
                          className="text-[10px] shrink-0 ml-2"
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {assinante.plan && (
                          <span className="flex items-center gap-1">
                            <Crown className="h-3 w-3" />{' '}
                            {assinante.plan.name}
                          </span>
                        )}
                        {assinante.city && (
                          <span>{assinante.city.name}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-end mt-2 gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          asChild
                        >
                          <Link
                            href={`/admin/assinantes/${assinante.id}`}
                          >
                            <Pencil className="h-3 w-3 mr-1" /> Editar
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              id: assinante.id,
                              name: assinante.name,
                            })
                          }
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Assinante</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{' '}
              <strong>{deleteDialog.name}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.id && handleDelete(deleteDialog.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
