'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Plus,
  Users,
  Pencil,
  Trash2,
  Loader2,
  Search,
  MoreHorizontal,
  QrCode,
  MapPin,
  CreditCard,
  Coins,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Skeleton } from '@/components/ui/skeleton'
import { SUBSCRIPTION_STATUS } from '@/constants'

// Schema de validação
const subscriberSchema = z.object({
  email: z.string().email('Email inválido').or(z.literal('')),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').or(z.literal('')),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().length(11, 'CPF deve ter 11 dígitos').or(z.literal('')),
  phone: z.string().min(10, 'Telefone inválido'),
  cityId: z.string().optional().or(z.literal('')),
  planId: z.string().optional().or(z.literal('')),
  subscriptionStatus: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELED', 'INACTIVE', 'EXPIRED']),
})

type SubscriberFormData = z.infer<typeof subscriberSchema>

interface City {
  id: string
  name: string
  state: string
}

interface Plan {
  id: string
  name: string
  price: string | number
}

interface Subscriber {
  id: string
  name: string
  cpf: string
  phone: string
  points: string | number
  cashback: string | number
  qrCode: string
  subscriptionStatus: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED'
  city: City | null
  plan: Plan | null
  planStartDate?: string | null
  planEndDate?: string | null
  user: {
    email: string
    isActive: boolean
  }
  _count: {
    transactions: number
  }
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  ACTIVE: 'bg-green-500/10 text-green-600 border-green-500/20',
  SUSPENDED: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  CANCELED: 'bg-red-500/10 text-red-600 border-red-500/20',
  INACTIVE: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  EXPIRED: 'bg-red-500/10 text-red-600 border-red-500/20',
}

export default function AssinantesPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCity, setFilterCity] = useState<string>('all')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubscriberFormData>({
    resolver: zodResolver(subscriberSchema),
  })

  // Buscar assinantes
  const fetchSubscribers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/subscribers')
      const result = await response.json()
      
      if (response.ok) {
        setSubscribers(result.data)
      } else {
        toast.error(result.error || 'Erro ao carregar assinantes')
      }
    } catch {
      toast.error('Erro ao carregar assinantes')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Buscar cidades
  const fetchCities = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/cities')
      const result = await response.json()
      if (response.ok) setCities(result.data)
    } catch {
      console.error('Erro ao carregar cidades')
    }
  }, [])

  // Buscar planos
  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/plans')
      const result = await response.json()
      if (response.ok) setPlans(result.data)
    } catch {
      console.error('Erro ao carregar planos')
    }
  }, [])

  useEffect(() => {
    fetchSubscribers()
    fetchCities()
    fetchPlans()
  }, [fetchSubscribers, fetchCities, fetchPlans])

  // Abrir modal para criar
  function handleCreate() {
    setSelectedSubscriber(null)
    reset({
      email: '',
      password: '',
      name: '',
      cpf: '',
      phone: '',
      cityId: '',
      planId: '',
      subscriptionStatus: 'ACTIVE',
    })
    setIsDialogOpen(true)
  }

  // Abrir modal para editar
  function handleEdit(subscriber: Subscriber) {
    setSelectedSubscriber(subscriber)
    reset({
      email: '',
      password: '',
      name: subscriber.name,
      cpf: subscriber.cpf,
      phone: subscriber.phone,
      cityId: subscriber.city?.id || '',
      planId: subscriber.plan?.id || '',
      subscriptionStatus: subscriber.subscriptionStatus,
    })
    setIsDialogOpen(true)
  }

  // Abrir confirmação de exclusão
  function handleDeleteClick(subscriber: Subscriber) {
    setSelectedSubscriber(subscriber)
    setIsDeleteDialogOpen(true)
  }

  // Salvar assinante (criar)
  async function onSubmitCreate(data: SubscriberFormData) {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Assinante criado com sucesso!')
        setIsDialogOpen(false)
        fetchSubscribers()
      } else {
        toast.error(result.error || 'Erro ao criar assinante')
      }
    } catch {
      toast.error('Erro ao criar assinante')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Salvar assinante (editar)
  async function onSubmitEdit(data: SubscriberFormData) {
    if (!selectedSubscriber) return
    setIsSubmitting(true)

    const { email, password, cpf, ...editData } = data

    try {
      const response = await fetch(`/api/admin/subscribers/${selectedSubscriber.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Assinante atualizado!')
        setIsDialogOpen(false)
        fetchSubscribers()
      } else {
        toast.error(result.error || 'Erro ao atualizar assinante')
      }
    } catch {
      toast.error('Erro ao atualizar assinante')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Excluir assinante
  async function handleDelete() {
    if (!selectedSubscriber) return
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/subscribers/${selectedSubscriber.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Assinante excluído!')
        setIsDeleteDialogOpen(false)
        fetchSubscribers()
      } else {
        toast.error(result.error || 'Erro ao excluir assinante')
      }
    } catch {
      toast.error('Erro ao excluir assinante')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Alterar status
  async function handleChangeStatus(subscriber: Subscriber, newStatus: string) {
    try {
      const response = await fetch(`/api/admin/subscribers/${subscriber.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionStatus: newStatus }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Status atualizado!')
        fetchSubscribers()
      } else {
        toast.error(result.error || 'Erro ao alterar status')
      }
    } catch {
      toast.error('Erro ao alterar status')
    }
  }

  // Formatar CPF
  function formatCPF(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  // Formatar moeda
  function formatCurrency(value: string | number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value))
  }

  // Filtrar assinantes
  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch = 
      subscriber.name.toLowerCase().includes(search.toLowerCase()) ||
      subscriber.cpf.includes(search) ||
      subscriber.user?.email?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || subscriber.subscriptionStatus === filterStatus
    const matchesCity = filterCity === 'all' || subscriber.city?.id === filterCity
    const matchesPlan = filterPlan === 'all' || subscriber.plan?.id === filterPlan
    return matchesSearch && matchesStatus && matchesCity && matchesPlan
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assinantes</h1>
          <p className="text-muted-foreground">
            Gerencie os clientes do clube de benefícios
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Assinante
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar assinante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(SUBSCRIPTION_STATUS).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCity} onValueChange={setFilterCity}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPlan} onValueChange={setFilterPlan}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assinante</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead className="text-right">Pontos</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredSubscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {search || filterStatus !== 'all' || filterCity !== 'all' || filterPlan !== 'all'
                        ? 'Nenhum assinante encontrado' 
                        : 'Nenhum assinante cadastrado'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{subscriber.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCPF(subscriber.cpf)} • {subscriber.user?.email || '-'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {subscriber.plan ? (
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{subscriber.plan.name}</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">Sem plano</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {subscriber.city ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {subscriber.city.name}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Coins className="h-3 w-3 text-yellow-500" />
                      <span className="font-medium">{Number(subscriber.points).toFixed(0)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline" 
                      className={statusColors[subscriber.subscriptionStatus]}
                    >
                      {SUBSCRIPTION_STATUS[subscriber.subscriptionStatus].label}
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
                        <DropdownMenuItem onClick={() => handleEdit(subscriber)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info(`QR Code: ${subscriber.qrCode}`)}>
                          <QrCode className="mr-2 h-4 w-4" />
                          Ver QR Code
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleChangeStatus(subscriber, 'ACTIVE')}
                          disabled={subscriber.subscriptionStatus === 'ACTIVE'}
                        >
                          Ativar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleChangeStatus(subscriber, 'SUSPENDED')}
                          disabled={subscriber.subscriptionStatus === 'SUSPENDED'}
                        >
                          Suspender
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleChangeStatus(subscriber, 'CANCELED')}
                          disabled={subscriber.subscriptionStatus === 'CANCELED'}
                        >
                          Cancelar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClick(subscriber)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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
      </div>

      {/* Dialog Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedSubscriber ? 'Editar Assinante' : 'Novo Assinante'}
            </DialogTitle>
            <DialogDescription>
              {selectedSubscriber 
                ? 'Altere os dados do assinante' 
                : 'Preencha os dados para cadastrar um novo assinante'}
            </DialogDescription>
          </DialogHeader>

          <form 
            onSubmit={handleSubmit(selectedSubscriber ? onSubmitEdit : onSubmitCreate)} 
            className="space-y-4"
          >
            {/* Dados de acesso (apenas criar) */}
            {!selectedSubscriber && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Dados pessoais */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                placeholder="Nome do assinante"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {!selectedSubscriber && (
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="00000000000"
                    maxLength={11}
                    {...register('cpf')}
                  />
                  {errors.cpf && (
                    <p className="text-sm text-destructive">{errors.cpf.message}</p>
                  )}
                </div>
              )}
              <div className={`space-y-2 ${selectedSubscriber ? 'col-span-2' : ''}`}>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="66999999999"
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Select
                  value={watch('cityId')}
                  onValueChange={(value) => setValue('cityId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name} - {city.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cityId && (
                  <p className="text-sm text-destructive">{errors.cityId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select
                  value={watch('planId')}
                  onValueChange={(value) => setValue('planId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {formatCurrency(plan.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.planId && (
                  <p className="text-sm text-destructive">{errors.planId.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch('subscriptionStatus')}
                onValueChange={(value) => setValue('subscriptionStatus', value as SubscriberFormData['subscriptionStatus'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUBSCRIPTION_STATUS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o assinante <strong>{selectedSubscriber?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
