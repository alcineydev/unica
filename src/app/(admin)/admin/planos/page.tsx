'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
  Copy,
  ExternalLink,
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
import { Card, CardContent } from '@/components/ui/card'
import { BENEFIT_TYPES } from '@/constants'

// Schema de validação
const planSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  price: z.number().min(0.01, 'Preço mensal é obrigatório'),
  slug: z.string().optional().nullable(),
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
  priceYearly: string | number | null
  priceSingle: string | number | null
  isActive: boolean
  createdAt: string
  planBenefits: PlanBenefit[]
  _count: {
    assinantes: number
  }
}

// Componente de loading
function PlanosLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

// Componente principal que usa useSearchParams
function PlanosContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
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

  // Abrir modal para criar
  const handleCreate = useCallback(() => {
    setSelectedPlan(null)
    setSelectedBenefits([])
    reset({
      name: '',
      description: '',
      price: 0,
      slug: '',
      priceYearly: null,
      priceSingle: null,
      benefitIds: [],
    })
    setIsDialogOpen(true)
  }, [reset])

  // Abrir modal automaticamente se vier com action=create
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      handleCreate()
      // Limpar o parâmetro da URL
      router.replace('/admin/planos')
    }
  }, [searchParams, handleCreate, router])

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

  // Copiar link do checkout
  function copyCheckoutLink(slug: string) {
    const url = `https://unica-theta.vercel.app/checkout/${slug}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado!')
  }

  // Abrir checkout em nova aba
  function openCheckout(slug: string) {
    window.open(`/checkout/${slug}`, '_blank')
  }

  // Filtrar planos
  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(search.toLowerCase()) ||
    plan.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Planos</h1>
          <p className="text-sm text-muted-foreground">Crie planos combinando benefícios e definindo preços</p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {/* Filtros responsivos */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar plano..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Listagem */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPlans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {search ? 'Nenhum plano encontrado' : 'Nenhum plano cadastrado'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="lg:hidden space-y-3">
            {filteredPlans.map((plan) => (
              <Card key={plan.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold truncate">{plan.name}</p>
                        <Badge variant={plan.isActive ? "default" : "secondary"} className={plan.isActive ? "bg-green-100 text-green-700 border-0" : ""}>
                          {plan.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{plan.description}</p>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">
                          {formatPrice(plan.price)}
                        </span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          {plan.planBenefits.length} benefícios
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {plan._count.assinantes} assinantes
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
                        <DropdownMenuItem onClick={() => handleEdit(plan)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        {plan.slug && (
                          <>
                            <DropdownMenuItem onClick={() => copyCheckoutLink(plan.slug!)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openCheckout(plan.slug!)}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Abrir checkout
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteClick(plan)} className="text-red-600">
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
          <div className="hidden lg:block rounded-lg border overflow-hidden">
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
                {filteredPlans.map((plan) => (
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
                        {(plan.priceYearly || plan.priceSingle) && (
                          <div className="text-xs text-muted-foreground">
                            {plan.priceYearly && <span>Anual: {formatPrice(plan.priceYearly)}</span>}
                            {plan.priceSingle && <span className="ml-2">Vitalício: {formatPrice(plan.priceSingle)}</span>}
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
                      <Badge variant={plan.isActive ? 'default' : 'secondary'} className={plan.isActive ? "bg-green-100 text-green-700 border-0" : ""}>
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
                          {plan.slug && (
                            <>
                              <DropdownMenuItem onClick={() => copyCheckoutLink(plan.slug!)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copiar link do checkout
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openCheckout(plan.slug!)}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Abrir checkout
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
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
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

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
              <Label className="text-base font-semibold">Preços</Label>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço Mensal (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="29.90"
                    {...register('price', { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Valor cobrado mensalmente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceYearly">Preço Anual (R$)</Label>
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
                    Opcional - deixe vazio se não oferecer
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceSingle">Preço Vitalício (R$)</Label>
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
                    Opcional - pagamento único
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

// Página principal com Suspense
export default function PlanosPage() {
  return (
    <Suspense fallback={<PlanosLoading />}>
      <PlanosContent />
    </Suspense>
  )
}
