'use client'

import { useState, useEffect, useCallback, Component, ReactNode } from 'react'
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
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'

import { UserAvatar } from '@/components/ui/user-avatar'
import { Card, CardContent } from '@/components/ui/card'
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

// Error Boundary para capturar erros
interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Erro capturado:', error)
    console.error('[ErrorBoundary] Info:', errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-6 w-6" />
            <h2 className="text-xl font-bold">Erro na página de Assinantes</h2>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-medium text-red-800 mb-2">Mensagem do erro:</p>
            <pre className="text-sm text-red-700 whitespace-pre-wrap break-words">
              {this.state.error?.message || 'Erro desconhecido'}
            </pre>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="font-medium text-gray-800 mb-2">Stack trace:</p>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words overflow-auto max-h-64">
              {this.state.error?.stack || 'Stack não disponível'}
            </pre>
          </div>
          <Button onClick={() => window.location.reload()}>
            Recarregar página
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

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
  subscriptionStatus?: string | null
  city?: City | null
  plan?: Plan | null
  planStartDate?: string | null
  planEndDate?: string | null
  user?: {
    email: string
    isActive: boolean
    avatar?: string | null
  } | null
  _count?: {
    transactions: number
  }
}

// Função para obter label do status com fallback seguro
function getStatusLabel(status: string | undefined | null): string {
  if (!status) return 'Pendente'
  const statusMap: Record<string, string> = {
    'ACTIVE': 'Ativo',
    'PENDING': 'Pendente',
    'INACTIVE': 'Inativo',
    'EXPIRED': 'Expirado',
    'SUSPENDED': 'Suspenso',
    'CANCELED': 'Cancelado',
  }
  return statusMap[status] || status
}

// Função para obter cor do status com fallback seguro
function getStatusColor(status: string | undefined | null): string {
  if (!status) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
  const colorMap: Record<string, string> = {
    'ACTIVE': 'bg-green-500/10 text-green-600 border-green-500/20',
    'PENDING': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    'INACTIVE': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    'EXPIRED': 'bg-red-500/10 text-red-600 border-red-500/20',
    'SUSPENDED': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    'CANCELED': 'bg-red-500/10 text-red-600 border-red-500/20',
  }
  return colorMap[status] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
}

// Componente principal da página (envolvido no ErrorBoundary)
export default function AssinantesPage() {
  return (
    <ErrorBoundary>
      <AssinantesContent />
    </ErrorBoundary>
  )
}

function AssinantesContent() {
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
  const [showPlanWarning, setShowPlanWarning] = useState(false)

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

  // Observa mudanças no status para mostrar aviso e limpar plano
  const watchedStatus = watch('subscriptionStatus')
  const currentStatus = watchedStatus || 'PENDING' // Fallback para evitar undefined
  const currentPlanId = watch('planId') || 'none'
  const currentCityId = watch('cityId') || 'none'

  // Função para lidar com mudança de status
  function handleStatusChange(newStatus: string) {
    setValue('subscriptionStatus', newStatus as SubscriberFormData['subscriptionStatus'])
    
    // Se status não é ACTIVE, remove o plano
    if (newStatus !== 'ACTIVE') {
      setValue('planId', 'none')
      // Mostra aviso apenas se assinante tinha um plano
      if (selectedSubscriber?.plan || (currentPlanId && currentPlanId !== 'none')) {
        setShowPlanWarning(true)
      }
    } else {
      setShowPlanWarning(false)
    }
  }

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
    setShowPlanWarning(false)
    reset({
      email: '',
      password: '',
      name: '',
      cpf: '',
      phone: '',
      cityId: 'none',
      planId: 'none',
      subscriptionStatus: 'ACTIVE',
    })
    setIsDialogOpen(true)
  }

  // Abrir modal para editar
  function handleEdit(subscriber: Subscriber) {
    setSelectedSubscriber(subscriber)
    setShowPlanWarning(false)
    reset({
      email: '',
      password: '',
      name: subscriber.name || '',
      cpf: subscriber.cpf || '',
      phone: subscriber.phone || '',
      cityId: subscriber.city?.id || 'none',
      planId: subscriber.plan?.id || 'none',
      subscriptionStatus: (subscriber.subscriptionStatus as SubscriberFormData['subscriptionStatus']) || 'PENDING',
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

    // Converte 'none' de volta para valores que a API entende
    const payload = {
      ...data,
      cityId: data.cityId === 'none' ? '' : data.cityId,
      planId: data.planId === 'none' ? '' : data.planId,
    }

    try {
      const response = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

    const { email, password, cpf, ...rest } = data
    
    // Converte 'none' de volta para valores que a API entende
    const editData = {
      ...rest,
      cityId: rest.cityId === 'none' ? null : rest.cityId,
      planId: rest.planId === 'none' ? null : rest.planId,
    }

    try {
      console.log('[EDIT] Payload enviado:', editData)
      
      const response = await fetch(`/api/admin/subscribers/${selectedSubscriber.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      const result = await response.json()
      console.log('[EDIT] Resposta:', result)

      if (response.ok) {
        toast.success('Assinante atualizado!')
        setIsDialogOpen(false)
        fetchSubscribers()
      } else {
        console.error('[EDIT] Erro:', result)
        toast.error(result.error || 'Erro ao atualizar assinante')
      }
    } catch (error) {
      console.error('[EDIT] Exceção:', error)
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
      (subscriber.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (subscriber.cpf || '').includes(search) ||
      (subscriber.user?.email || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || (subscriber.subscriptionStatus || 'PENDING') === filterStatus
    const matchesCity = filterCity === 'all' || subscriber.city?.id === filterCity
    const matchesPlan = filterPlan === 'all' || subscriber.plan?.id === filterPlan
    return matchesSearch && matchesStatus && matchesCity && matchesPlan
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Assinantes</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os clientes do clube de benefícios
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Assinante
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar assinante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full">
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
            <SelectTrigger className="w-full">
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
            <SelectTrigger className="w-full">
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
      </div>

      {/* Lista de Assinantes */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredSubscribers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {search || filterStatus !== 'all' || filterCity !== 'all' || filterPlan !== 'all'
              ? 'Nenhum assinante encontrado' 
              : 'Nenhum assinante cadastrado'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="lg:hidden space-y-3">
            {filteredSubscribers.map((subscriber) => (
              <Card key={subscriber.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      src={subscriber.user?.avatar}
                      name={subscriber.name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{subscriber.name || 'Sem nome'}</p>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(subscriber.subscriptionStatus)}
                        >
                          {getStatusLabel(subscriber.subscriptionStatus)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{subscriber.user?.email}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {subscriber.plan && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {subscriber.plan.name}
                          </span>
                        )}
                        {subscriber.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {subscriber.city.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Coins className="h-3 w-3 text-yellow-500" />
                          {Number(subscriber.points || 0).toFixed(0)} pts
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
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
                          className="text-destructive"
                          onClick={() => handleDeleteClick(subscriber)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden lg:block rounded-md border">
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
                {filteredSubscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar 
                          src={subscriber.user?.avatar} 
                          name={subscriber.name} 
                          size="sm"
                        />
                        <div>
                          <p className="font-medium">{subscriber.name || 'Sem nome'}</p>
                          <p className="text-xs text-muted-foreground">
                            {subscriber.cpf ? formatCPF(subscriber.cpf) : '-'} • {subscriber.user?.email || '-'}
                          </p>
                        </div>
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
                        <span className="font-medium">{Number(subscriber.points || 0).toFixed(0)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(subscriber.subscriptionStatus)}
                      >
                        {getStatusLabel(subscriber.subscriptionStatus)}
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
                            disabled={(subscriber.subscriptionStatus || 'PENDING') === 'ACTIVE'}
                          >
                            Ativar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleChangeStatus(subscriber, 'SUSPENDED')}
                            disabled={(subscriber.subscriptionStatus || 'PENDING') === 'SUSPENDED'}
                          >
                            Suspender
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleChangeStatus(subscriber, 'CANCELED')}
                            disabled={(subscriber.subscriptionStatus || 'PENDING') === 'CANCELED'}
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
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

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
                  value={currentCityId}
                  onValueChange={(value) => setValue('cityId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione uma cidade</SelectItem>
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
                  value={currentPlanId}
                  onValueChange={(value) => setValue('planId', value)}
                  disabled={(currentStatus || 'PENDING') !== 'ACTIVE'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={(currentStatus || 'PENDING') !== 'ACTIVE' ? 'Indisponível' : 'Selecione'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem plano</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {formatCurrency(plan.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(currentStatus || 'PENDING') !== 'ACTIVE' && (
                  <p className="text-xs text-muted-foreground">
                    Plano só pode ser atribuído quando status for &quot;Ativo&quot;
                  </p>
                )}
                {errors.planId && (
                  <p className="text-sm text-destructive">{errors.planId.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={currentStatus || 'PENDING'}
                onValueChange={handleStatusChange}
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

            {/* Aviso de remoção de plano */}
            {showPlanWarning && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Plano será removido</p>
                  <p className="text-amber-700">
                    Ao mudar o status para diferente de &quot;Ativo&quot;, o plano atual será desvinculado do assinante.
                  </p>
                </div>
              </div>
            )}

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

