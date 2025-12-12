'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Plus,
  CreditCard,
  Pencil,
  Trash2,
  Loader2,
  Search,
  MoreHorizontal,
  Power,
  PowerOff,
  Users,
  Gift,
  Check,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import { Card, CardContent } from '@/components/ui/card'
import { BENEFIT_TYPES } from '@/constants'

// Schema de validação
const planSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  price: z.number().min(0, 'Preço não pode ser negativo'),
  slug: z.string().optional().nullable(),
  priceMonthly: z.number().min(0).optional().nullable(),
  priceYearly: z.number().min(0).optional().nullable(),
  priceSingle: z.number().min(0).optional().nullable(),
  benefitIds: z.array(z.string()).min(1, 'Selecione pelo menos um benefício'),
})

type PlanFormData = z.infer<typeof planSchema>

// Função para gerar slug
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface Benefit {
  id: string
  name: string
  type: 'DESCONTO' | 'CASHBACK' | 'PONTOS' | 'ACESSO_EXCLUSIVO'
  value: Record<string, unknown>
}

interface PlanBenefit {
  benefit: Benefit
}

interface Plan {
  id: string
  name: string
  description: string
  price: string | number
  slug: string | null
  priceMonthly: string | number | null
  priceYearly: string | number | null
  priceSingle: string | number | null
  isActive: boolean
  createdAt: string
  planBenefits: PlanBenefit[]
  _count: {
    assinantes: number
  }
}

export default function PlanosPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
  })

  // Buscar planos
  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/plans?includeInactive=true')
      const result = await response.json()
      
      if (response.ok) {
        setPlans(result.data)
      } else {
        toast.error(result.error || 'Erro ao carregar planos')
      }
    } catch {
      toast.error('Erro ao carregar planos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Buscar benefícios
  const fetchBenefits = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/benefits')
      const result = await response.json()
      
      if (response.ok) {
        setBenefits(result.data)
      }
    } catch {
      console.error('Erro ao carregar benefícios')
    }
  }, [])

  useEffect(() => {
    fetchPlans()
    fetchBenefits()
  }, [fetchPlans, fetchBenefits])

  // Abrir modal para criar
  function handleCreate() {
    setSelectedPlan(null)
    setSelectedBenefits([])
    reset({
      name: '',
      description: '',
      price: 0,
      slug: '',
      priceMonthly: null,
      priceYearly: null,
      priceSingle: null,
      benefitIds: [],
    })
    setIsDialogOpen(true)
  }

  // Abrir modal para editar
  function handleEdit(plan: Plan) {
    setSelectedPlan(plan)
    const benefitIds = plan.planBenefits.map((pb) => pb.benefit.id)
    setSelectedBenefits(benefitIds)
    reset({
      name: plan.name,
      description: plan.description,
      price: Number(plan.price),
      slug: plan.slug || '',
      priceMonthly: plan.priceMonthly ? Number(plan.priceMonthly) : null,
      priceYearly: plan.priceYearly ? Number(plan.priceYearly) : null,
      priceSingle: plan.priceSingle ? Number(plan.priceSingle) : null,
      benefitIds,
    })
    setIsDialogOpen(true)
  }

  // Abrir confirmação de exclusão
  function handleDeleteClick(plan: Plan) {
    setSelectedPlan(plan)
    setIsDeleteDialogOpen(true)
  }

  // Toggle benefício selecionado
  function toggleBenefit(benefitId: string) {
    setSelectedBenefits((prev) => {
      const newSelection = prev.includes(benefitId)
        ? prev.filter((id) => id !== benefitId)
        : [...prev, benefitId]
      
      setValue('benefitIds', newSelection)
      return newSelection
    })
  }

  // Salvar plano
  async function onSubmit(data: PlanFormData) {
    setIsSubmitting(true)

    const payload = {
      ...data,
      benefitIds: selectedBenefits,
    }

    try {
      const url = selectedPlan 
        ? `/api/admin/plans/${selectedPlan.id}` 
        : '/api/admin/plans'
      
      const method = selectedPlan ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(selectedPlan ? 'Plano atualizado!' : 'Plano criado!')
        setIsDialogOpen(false)
        fetchPlans()
      } else {
        toast.error(result.error || 'Erro ao salvar plano')
      }
    } catch {
      toast.error('Erro ao salvar plano')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Excluir plano
  async function handleDelete() {
    if (!selectedPlan) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Plano excluído!')
        setIsDeleteDialogOpen(false)
        fetchPlans()
      } else {
        toast.error(result.error || 'Erro ao excluir plano')
      }
    } catch {
      toast.error('Erro ao excluir plano')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Alternar status
  async function handleToggleStatus(plan: Plan) {
    try {
      const response = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !plan.isActive }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(plan.isActive ? 'Plano desativado!' : 'Plano ativado!')
        fetchPlans()
      } else {
        toast.error(result.error || 'Erro ao alterar status')
      }
    } catch {
      toast.error('Erro ao alterar status')
    }
  }

  // Formatar preço
  function formatPrice(price: string | number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(price))
  }

  // Filtrar planos
  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(search.toLowerCase()) ||
    plan.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planos</h1>
          <p className="text-muted-foreground">
            Crie planos combinando benefícios e definindo preços
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar plano..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plano</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="text-center">Benefícios</TableHead>
              <TableHead className="text-center">Assinantes</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredPlans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {search ? 'Nenhum plano encontrado' : 'Nenhum plano cadastrado'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {plan.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-primary">
                        {formatPrice(plan.price)}<span className="text-xs font-normal text-muted-foreground">/mês</span>
                      </p>
                      {(plan.priceMonthly || plan.priceYearly || plan.priceSingle) && (
                        <div className="text-xs text-muted-foreground">
                          {plan.priceYearly && <span>Anual: {formatPrice(plan.priceYearly)}</span>}
                          {plan.priceSingle && <span className="ml-2">Único: {formatPrice(plan.priceSingle)}</span>}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Gift className="h-4 w-4 text-muted-foreground" />
                      {plan.planBenefits.length}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {plan._count.assinantes}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={plan.isActive ? 'default' : 'secondary'}>
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
                        <DropdownMenuItem onClick={() => handleEdit(plan)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(plan)}>
                          {plan.isActive ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClick(plan)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPlan ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan 
                ? 'Altere os dados do plano' 
                : 'Preencha os dados e selecione os benefícios do plano'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano</Label>
                <Input
                  id="name"
                  placeholder="Ex: Premium"
                  {...register('name', {
                    onChange: (e) => {
                      // Gerar slug automaticamente ao digitar o nome
                      if (!selectedPlan) {
                        const slugValue = generateSlug(e.target.value)
                        setValue('slug', slugValue)
                      }
                    }
                  })}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  placeholder="plano-premium"
                  {...register('slug')}
                />
                <p className="text-xs text-muted-foreground">
                  URL amigável para o plano (gerado automaticamente)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva os principais benefícios do plano..."
                rows={2}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Preços */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">💰 Preços</Label>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço Base (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="49.90"
                    {...register('price', { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceMonthly">Mensal (R$)</Label>
                  <Input
                    id="priceMonthly"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="29.90"
                    {...register('priceMonthly', { 
                      setValueAs: (v) => v === '' ? null : parseFloat(v) 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceYearly">Anual (R$)</Label>
                  <Input
                    id="priceYearly"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="299.90"
                    {...register('priceYearly', { 
                      setValueAs: (v) => v === '' ? null : parseFloat(v) 
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Desconto para pagamento anual
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceSingle">Único (R$)</Label>
                  <Input
                    id="priceSingle"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="499.90"
                    {...register('priceSingle', { 
                      setValueAs: (v) => v === '' ? null : parseFloat(v) 
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Pagamento único (vitalício)
                  </p>
                </div>
              </div>
            </div>

            {/* Seleção de Benefícios */}
            <div className="space-y-3">
              <Label>Benefícios Incluídos</Label>
              {errors.benefitIds && (
                <p className="text-sm text-destructive">{errors.benefitIds.message}</p>
              )}
              
              <div className="grid gap-2 md:grid-cols-2">
                {benefits.length === 0 ? (
                  <p className="text-sm text-muted-foreground col-span-2">
                    Nenhum benefício cadastrado. Crie benefícios primeiro.
                  </p>
                ) : (
                  benefits.map((benefit) => {
                    const isSelected = selectedBenefits.includes(benefit.id)
                    const value = benefit.value as Record<string, number | string>
                    
                    return (
                      <Card
                        key={benefit.id}
                        className={`cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-muted-foreground/50'
                        }`}
                        onClick={() => toggleBenefit(benefit.id)}
                      >
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                            isSelected 
                              ? 'bg-primary border-primary text-primary-foreground' 
                              : 'border-muted-foreground/30'
                          }`}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{benefit.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {BENEFIT_TYPES[benefit.type].label}
                              {value.percentage && ` • ${value.percentage}%`}
                              {value.monthlyPoints && ` • ${value.monthlyPoints} pts`}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                {selectedBenefits.length} benefício(s) selecionado(s)
              </p>
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
              Tem certeza que deseja excluir o plano <strong>{selectedPlan?.name}</strong>?
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
