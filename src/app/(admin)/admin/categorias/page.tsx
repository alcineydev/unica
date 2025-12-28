'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Tags,
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
import { ImageUpload } from '@/components/ui/image-upload'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  banner: string
  description: string | null
  displayOrder: number
  isActive: boolean
  createdAt: string
  _count?: {
    parceiros: number
  }
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formBanner, setFormBanner] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Buscar categorias
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/categories?includeInactive=true')
      const result = await response.json()

      if (response.ok) {
        setCategories(result.data || [])
      } else {
        toast.error(result.error || 'Erro ao carregar categorias')
      }
    } catch {
      toast.error('Erro ao carregar categorias')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Abrir modal para criar
  function handleCreate() {
    setSelectedCategory(null)
    setFormName('')
    setFormBanner(null)
    setFormError(null)
    setIsDialogOpen(true)
  }

  // Abrir modal para editar
  function handleEdit(category: Category) {
    setSelectedCategory(category)
    setFormName(category.name)
    setFormBanner(category.banner)
    setFormError(null)
    setIsDialogOpen(true)
  }

  // Abrir confirmação de exclusão
  function handleDeleteClick(category: Category) {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  // Salvar categoria (criar ou atualizar)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    // Validação
    if (!formName.trim()) {
      setFormError('Nome é obrigatório')
      return
    }
    if (!formBanner) {
      setFormError('Banner é obrigatório')
      return
    }

    setIsSubmitting(true)

    try {
      const url = selectedCategory
        ? `/api/admin/categories/${selectedCategory.id}`
        : '/api/admin/categories'

      const method = selectedCategory ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          banner: formBanner
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(selectedCategory ? 'Categoria atualizada!' : 'Categoria criada!')
        setIsDialogOpen(false)
        fetchCategories()
      } else {
        setFormError(result.error || 'Erro ao salvar categoria')
      }
    } catch {
      setFormError('Erro ao salvar categoria')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Excluir categoria
  async function handleDelete() {
    if (!selectedCategory) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/categories/${selectedCategory.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Categoria excluída!')
        setIsDeleteDialogOpen(false)
        fetchCategories()
      } else {
        toast.error(result.error || 'Erro ao excluir categoria')
      }
    } catch {
      toast.error('Erro ao excluir categoria')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Alternar status (ativar/desativar)
  async function handleToggleStatus(category: Category) {
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !category.isActive }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(category.isActive ? 'Categoria desativada!' : 'Categoria ativada!')
        fetchCategories()
      } else {
        toast.error(result.error || 'Erro ao alterar status')
      }
    } catch {
      toast.error('Erro ao alterar status')
    }
  }

  // Filtrar categorias pela busca
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">Gerencie as categorias de parceiros</p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Filtros responsivos */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar categoria..."
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
      ) : filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tags className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {search ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              {/* Banner */}
              <div className="relative aspect-[4/1] bg-muted">
                {category.banner && (
                  <Image
                    src={category.banner}
                    alt={category.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
                {!category.isActive && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge variant="secondary">Inativa</Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category._count?.parceiros || 0} parceiro(s)
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(category)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(category)}>
                        {category.isActive ? (
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
                        onClick={() => handleDeleteClick(category)}
                        className="text-destructive"
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
      )}

      {/* Dialog Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? 'Altere os dados da categoria'
                : 'Preencha os dados para cadastrar uma nova categoria'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Categoria</Label>
              <Input
                id="name"
                placeholder="Ex: Restaurantes"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            {/* Banner */}
            <div className="space-y-2">
              <Label>Banner</Label>
              <ImageUpload
                value={formBanner}
                onChange={setFormBanner}
                folder="categories"
                aspectRatio="banner"
                placeholder="Clique para fazer upload do banner"
              />
              <p className="text-xs text-muted-foreground">
                Proporção recomendada: 4:1 (ex: 1200x300 pixels)
              </p>
            </div>

            {/* Erro */}
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
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
              Tem certeza que deseja excluir a categoria <strong>{selectedCategory?.name}</strong>?
              {selectedCategory?._count?.parceiros && selectedCategory._count.parceiros > 0 && (
                <span className="block mt-2 text-amber-600">
                  Atenção: Esta categoria possui {selectedCategory._count.parceiros} parceiro(s) vinculado(s).
                </span>
              )}
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
