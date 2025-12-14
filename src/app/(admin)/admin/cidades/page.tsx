'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Loader2,
  Search,
  MoreHorizontal,
  Power,
  PowerOff,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
import { BRAZILIAN_STATES } from '@/constants'

// Schema de validação
const citySchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  state: z.string().length(2, 'Selecione um estado'),
})

type CityFormData = z.infer<typeof citySchema>

interface City {
  id: string
  name: string
  state: string
  isActive: boolean
  createdAt: string
  _count: {
    parceiros: number
    assinantes: number
  }
}

export default function CidadesPage() {
  const [cities, setCities] = useState<City[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
  })

  // Buscar cidades
  const fetchCities = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/cities?includeInactive=true')
      const result = await response.json()
      
      if (response.ok) {
        setCities(result.data)
      } else {
        toast.error(result.error || 'Erro ao carregar cidades')
      }
    } catch {
      toast.error('Erro ao carregar cidades')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCities()
  }, [fetchCities])

  // Abrir modal para criar
  function handleCreate() {
    setSelectedCity(null)
    reset({ name: '', state: '' })
    setIsDialogOpen(true)
  }

  // Abrir modal para editar
  function handleEdit(city: City) {
    setSelectedCity(city)
    reset({ name: city.name, state: city.state })
    setIsDialogOpen(true)
  }

  // Abrir confirmação de exclusão
  function handleDeleteClick(city: City) {
    setSelectedCity(city)
    setIsDeleteDialogOpen(true)
  }

  // Salvar cidade (criar ou atualizar)
  async function onSubmit(data: CityFormData) {
    setIsSubmitting(true)

    try {
      const url = selectedCity 
        ? `/api/admin/cities/${selectedCity.id}` 
        : '/api/admin/cities'
      
      const method = selectedCity ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(selectedCity ? 'Cidade atualizada!' : 'Cidade criada!')
        setIsDialogOpen(false)
        fetchCities()
      } else {
        toast.error(result.error || 'Erro ao salvar cidade')
      }
    } catch {
      toast.error('Erro ao salvar cidade')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Excluir cidade
  async function handleDelete() {
    if (!selectedCity) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/cities/${selectedCity.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Cidade excluída!')
        setIsDeleteDialogOpen(false)
        fetchCities()
      } else {
        toast.error(result.error || 'Erro ao excluir cidade')
      }
    } catch {
      toast.error('Erro ao excluir cidade')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Alternar status (ativar/desativar)
  async function handleToggleStatus(city: City) {
    try {
      const response = await fetch(`/api/admin/cities/${city.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !city.isActive }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(city.isActive ? 'Cidade desativada!' : 'Cidade ativada!')
        fetchCities()
      } else {
        toast.error(result.error || 'Erro ao alterar status')
      }
    } catch {
      toast.error('Erro ao alterar status')
    }
  }

  // Filtrar cidades pela busca
  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(search.toLowerCase()) ||
    city.state.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Cidades</h1>
          <p className="text-sm text-muted-foreground">Gerencie as cidades onde o Unica está disponível</p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova Cidade
        </Button>
      </div>

      {/* Filtros responsivos */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar cidade..."
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
      ) : filteredCities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {search ? 'Nenhuma cidade encontrada' : 'Nenhuma cidade cadastrada'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="lg:hidden space-y-3">
            {filteredCities.map((city) => (
              <Card key={city.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{city.name}</p>
                          <Badge variant={city.isActive ? "default" : "secondary"} className={city.isActive ? "bg-green-100 text-green-700 border-0" : ""}>
                            {city.isActive ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{city.state}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{city._count.parceiros} parceiros</span>
                          <span>{city._count.assinantes} assinantes</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(city)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(city)}>
                          {city.isActive ? (
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
                        <DropdownMenuItem onClick={() => handleDeleteClick(city)} className="text-red-600">
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
                  <TableHead>Cidade</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Parceiros</TableHead>
                  <TableHead className="text-center">Assinantes</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCities.map((city) => (
                  <TableRow key={city.id}>
                    <TableCell className="font-medium">{city.name}</TableCell>
                    <TableCell>{city.state}</TableCell>
                    <TableCell className="text-center">{city._count.parceiros}</TableCell>
                    <TableCell className="text-center">{city._count.assinantes}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={city.isActive ? 'default' : 'secondary'} className={city.isActive ? "bg-green-100 text-green-700 border-0" : ""}>
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
                          <DropdownMenuItem onClick={() => handleEdit(city)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(city)}>
                            {city.isActive ? (
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
                            onClick={() => handleDeleteClick(city)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCity ? 'Editar Cidade' : 'Nova Cidade'}
            </DialogTitle>
            <DialogDescription>
              {selectedCity 
                ? 'Altere os dados da cidade' 
                : 'Preencha os dados para cadastrar uma nova cidade'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Cidade</Label>
              <Input
                id="name"
                placeholder="Ex: Sinop"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Select
                defaultValue={selectedCity?.state}
                onValueChange={(value) => setValue('state', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label} ({state.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state.message}</p>
              )}
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
              Tem certeza que deseja excluir a cidade <strong>{selectedCity?.name}</strong>?
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
