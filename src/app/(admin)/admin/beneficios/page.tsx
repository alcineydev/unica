'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Plus,
  Gift,
  Pencil,
  Trash2,
  Loader2,
  Search,
  MoreHorizontal,
  Power,
  PowerOff,
  Percent,
  RefreshCcw,
  Coins,
  Star,
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
import { BENEFIT_TYPES, PARTNER_CATEGORIES } from '@/constants'

// Schema de validação
const benefitSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  type: z.enum(['DESCONTO', 'CASHBACK', 'PONTOS', 'ACESSO_EXCLUSIVO']),
  category: z.string().optional(),
  // Campos específicos por tipo
  percentage: z.number().min(0.1).max(100).optional(),
  monthlyPoints: z.number().min(1).optional(),
})

type BenefitFormData = z.infer<typeof benefitSchema>

interface Benefit {
  id: string
  name: string
  description: string
  type: 'DESCONTO' | 'CASHBACK' | 'PONTOS' | 'ACESSO_EXCLUSIVO'
  value: Record<string, unknown>
  category: string | null
  isActive: boolean
  createdAt: string
  _count: {
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
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BenefitFormData>({
    resolver: zodResolver(benefitSchema),
  })

  const watchType = watch('type')

  // Buscar benefícios
  const fetchBenefits = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/benefits?includeInactive=true')
      const result = await response.json()
      
      if (response.ok) {
        setBenefits(result.data)
      } else {
        toast.error(result.error || 'Erro ao carregar benefícios')
      }
    } catch {
      toast.error('Erro ao carregar benefícios')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBenefits()
  }, [fetchBenefits])

  // Abrir modal para criar
  function handleCreate() {
    setSelectedBenefit(null)
    reset({
      name: '',
      description: '',
      type: 'DESCONTO',
      category: '',
      percentage: 10,
      monthlyPoints: 50,
    })
    setIsDialogOpen(true)
  }

  // Abrir modal para editar
  function handleEdit(benefit: Benefit) {
    setSelectedBenefit(benefit)
    const value = benefit.value as Record<string, number | string>
    reset({
      name: benefit.name,
      description: benefit.description,
      type: benefit.type,
      category: benefit.category || '',
      percentage: (value.percentage as number) || 10,
      monthlyPoints: (value.monthlyPoints as number) || 50,
    })
    setIsDialogOpen(true)
  }

  // Abrir confirmação de exclusão
  function handleDeleteClick(benefit: Benefit) {
    setSelectedBenefit(benefit)
    setIsDeleteDialogOpen(true)
  }

  // Salvar benefício
  async function onSubmit(data: BenefitFormData) {
    setIsSubmitting(true)

    // Monta o objeto value baseado no tipo
    let value: Record<string, unknown> = {}
    switch (data.type) {
      case 'DESCONTO':
        value = { percentage: data.percentage, category: data.category }
        break
      case 'CASHBACK':
        value = { percentage: data.percentage }
        break
      case 'PONTOS':
        value = { monthlyPoints: data.monthlyPoints }
        break
      case 'ACESSO_EXCLUSIVO':
        value = { tier: 'premium' }
        break
    }

    const payload = {
      name: data.name,
      description: data.description,
      type: data.type,
      value,
      category: data.type === 'DESCONTO' ? data.category : null,
    }

    try {
      const url = selectedBenefit 
        ? `/api/admin/benefits/${selectedBenefit.id}` 
        : '/api/admin/benefits'
      
      const method = selectedBenefit ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(selectedBenefit ? 'Benefício atualizado!' : 'Benefício criado!')
        setIsDialogOpen(false)
        fetchBenefits()
      } else {
        toast.error(result.error || 'Erro ao salvar benefício')
      }
    } catch {
      toast.error('Erro ao salvar benefício')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Excluir benefício
  async function handleDelete() {
    if (!selectedBenefit) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/benefits/${selectedBenefit.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Benefício excluído!')
        setIsDeleteDialogOpen(false)
        fetchBenefits()
      } else {
        toast.error(result.error || 'Erro ao excluir benefício')
      }
    } catch {
      toast.error('Erro ao excluir benefício')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Alternar status
  async function handleToggleStatus(benefit: Benefit) {
    try {
      const response = await fetch(`/api/admin/benefits/${benefit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !benefit.isActive }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(benefit.isActive ? 'Benefício desativado!' : 'Benefício ativado!')
        fetchBenefits()
      } else {
        toast.error(result.error || 'Erro ao alterar status')
      }
    } catch {
      toast.error('Erro ao alterar status')
    }
  }

  // Formatar valor para exibição
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

  // Filtrar benefícios
  const filteredBenefits = benefits.filter(benefit => {
    const matchesSearch = benefit.name.toLowerCase().includes(search.toLowerCase()) ||
      benefit.description.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || benefit.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Benefícios</h1>
          <p className="text-muted-foreground">
            Crie e gerencie os benefícios modulares do sistema
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Benefício
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar benefício..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
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

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Benefício</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="text-center">Planos</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredBenefits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Gift className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {search || filterType !== 'all' ? 'Nenhum benefício encontrado' : 'Nenhum benefício cadastrado'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredBenefits.map((benefit) => {
                const Icon = typeIcons[benefit.type]
                return (
                  <TableRow key={benefit.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{benefit.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {benefit.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${typeColors[benefit.type]}`}>
                        <Icon className="h-3 w-3" />
                        {BENEFIT_TYPES[benefit.type].label}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatValue(benefit)}
                    </TableCell>
                    <TableCell className="text-center">
                      {benefit._count.planBenefits}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={benefit.isActive ? 'default' : 'secondary'}>
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
                          <DropdownMenuItem onClick={() => handleEdit(benefit)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(benefit)}>
                            {benefit.isActive ? (
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
                            onClick={() => handleDeleteClick(benefit)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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
      </div>

      {/* Dialog Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedBenefit ? 'Editar Benefício' : 'Novo Benefício'}
            </DialogTitle>
            <DialogDescription>
              {selectedBenefit 
                ? 'Altere os dados do benefício' 
                : 'Preencha os dados para criar um novo benefício'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Benefício</Label>
              <Input
                id="name"
                placeholder="Ex: Desconto em Alimentação"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o benefício..."
                rows={3}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipo de Benefício</Label>
              <Select
                value={watchType}
                onValueChange={(value) => setValue('type', value as BenefitFormData['type'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BENEFIT_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {value.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campos específicos por tipo */}
            {(watchType === 'DESCONTO' || watchType === 'CASHBACK') && (
              <div className="space-y-2">
                <Label htmlFor="percentage">Percentual (%)</Label>
                <Input
                  id="percentage"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  {...register('percentage', { valueAsNumber: true })}
                />
              </div>
            )}

            {watchType === 'DESCONTO' && (
              <div className="space-y-2">
                <Label>Categoria (opcional)</Label>
                <Select
                  value={watch('category') || ''}
                  onValueChange={(value) => setValue('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as categorias</SelectItem>
                    {PARTNER_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {watchType === 'PONTOS' && (
              <div className="space-y-2">
                <Label htmlFor="monthlyPoints">Pontos Mensais</Label>
                <Input
                  id="monthlyPoints"
                  type="number"
                  min="1"
                  {...register('monthlyPoints', { valueAsNumber: true })}
                />
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
              Tem certeza que deseja excluir o benefício <strong>{selectedBenefit?.name}</strong>?
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
