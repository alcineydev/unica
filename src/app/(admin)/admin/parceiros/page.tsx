'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Plus,
  Store,
  Pencil,
  Trash2,
  Loader2,
  Search,
  MoreHorizontal,
  Power,
  PowerOff,
  MapPin,
  Phone,
  Mail,
  Building2,
} from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import { PARTNER_CATEGORIES } from '@/constants'
import Link from 'next/link'

// Schema de validação
const partnerSchema = z.object({
  email: z.string().email('Email inválido').or(z.literal('')),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').or(z.literal('')),
  companyName: z.string().min(3, 'Razão social deve ter no mínimo 3 caracteres'),
  tradeName: z.string().optional(),
  cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos').or(z.literal('')),
  category: z.string().min(1, 'Selecione uma categoria'),
  description: z.string().optional(),
  cityId: z.string().min(1, 'Selecione uma cidade'),
  whatsapp: z.string().min(10, 'WhatsApp inválido'),
  phone: z.string().optional(),
})

type PartnerFormData = z.infer<typeof partnerSchema>

interface City {
  id: string
  name: string
  state: string
}

interface Partner {
  id: string
  companyName: string
  tradeName: string | null
  cnpj: string
  category: string
  description: string | null
  logo: string | null
  contact: {
    whatsapp: string
    phone?: string
    email?: string
  }
  isActive: boolean
  city: City
  user: {
    email: string
    isActive: boolean
  }
  _count: {
    transactions: number
  }
}

export default function ParceirosPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterCity, setFilterCity] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
  })

  // Buscar parceiros
  const fetchPartners = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/partners?includeInactive=true')
      const result = await response.json()
      
      if (response.ok) {
        setPartners(result.data)
      } else {
        toast.error(result.error || 'Erro ao carregar parceiros')
      }
    } catch {
      toast.error('Erro ao carregar parceiros')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Buscar cidades
  const fetchCities = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/cities')
      const result = await response.json()
      
      if (response.ok) {
        setCities(result.data)
      }
    } catch {
      console.error('Erro ao carregar cidades')
    }
  }, [])

  useEffect(() => {
    fetchPartners()
    fetchCities()
  }, [fetchPartners, fetchCities])

  // Abrir modal para criar
  function handleCreate() {
    setSelectedPartner(null)
    reset({
      email: '',
      password: '',
      companyName: '',
      tradeName: '',
      cnpj: '',
      category: '',
      description: '',
      cityId: '',
      whatsapp: '',
      phone: '',
    })
    setIsDialogOpen(true)
  }

  // Abrir modal para editar
  function handleEdit(partner: Partner) {
    setSelectedPartner(partner)
    reset({
      email: '',
      password: '',
      companyName: partner.companyName,
      tradeName: partner.tradeName || '',
      cnpj: partner.cnpj,
      category: partner.category,
      description: partner.description || '',
      cityId: partner.city.id,
      whatsapp: partner.contact.whatsapp,
      phone: partner.contact.phone || '',
    })
    setIsDialogOpen(true)
  }

  // Abrir confirmação de exclusão
  function handleDeleteClick(partner: Partner) {
    setSelectedPartner(partner)
    setIsDeleteDialogOpen(true)
  }

  // Salvar parceiro (criar)
  async function onSubmitCreate(data: PartnerFormData) {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Parceiro criado com sucesso!')
        setIsDialogOpen(false)
        fetchPartners()
      } else {
        toast.error(result.error || 'Erro ao criar parceiro')
      }
    } catch {
      toast.error('Erro ao criar parceiro')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Salvar parceiro (editar)
  async function onSubmitEdit(data: PartnerFormData) {
    if (!selectedPartner) return
    setIsSubmitting(true)

    // Remove campos que não devem ser enviados na edição
    const { email, password, cnpj, ...editData } = data

    try {
      const response = await fetch(`/api/admin/partners/${selectedPartner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Parceiro atualizado!')
        setIsDialogOpen(false)
        fetchPartners()
      } else {
        toast.error(result.error || 'Erro ao atualizar parceiro')
      }
    } catch {
      toast.error('Erro ao atualizar parceiro')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Excluir parceiro
  async function handleDelete() {
    if (!selectedPartner) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/partners/${selectedPartner.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Parceiro excluído!')
        setIsDeleteDialogOpen(false)
        fetchPartners()
      } else {
        toast.error(result.error || 'Erro ao excluir parceiro')
      }
    } catch {
      toast.error('Erro ao excluir parceiro')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Alternar status
  async function handleToggleStatus(partner: Partner) {
    try {
      const response = await fetch(`/api/admin/partners/${partner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !partner.isActive }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(partner.isActive ? 'Parceiro desativado!' : 'Parceiro ativado!')
        fetchPartners()
      } else {
        toast.error(result.error || 'Erro ao alterar status')
      }
    } catch {
      toast.error('Erro ao alterar status')
    }
  }

  // Formatar CNPJ
  function formatCNPJ(cnpj: string): string {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  // Obter label da categoria
  function getCategoryLabel(value: string): string {
    return PARTNER_CATEGORIES.find(c => c.value === value)?.label || value
  }

  // Filtrar parceiros
  const filteredPartners = partners.filter(partner => {
    const matchesSearch = 
      partner.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (partner.tradeName?.toLowerCase().includes(search.toLowerCase())) ||
      partner.cnpj.includes(search)
    const matchesCategory = filterCategory === 'all' || partner.category === filterCategory
    const matchesCity = filterCity === 'all' || partner.city.id === filterCity
    return matchesSearch && matchesCategory && matchesCity
  })

  return (
    <div className="space-y-6">
      {/* Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Parceiros</h1>
          <p className="text-sm text-muted-foreground">Gerencie as empresas parceiras do clube</p>
        </div>
        <Link href="/admin/parceiros/novo">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Parceiro
          </Button>
        </Link>
      </div>

      {/* Filtros responsivos */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar parceiro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {PARTNER_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCity} onValueChange={setFilterCity}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas cidades</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name} - {city.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Listagem */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPartners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {search || filterCategory !== 'all' || filterCity !== 'all' 
                ? 'Nenhum parceiro encontrado' 
                : 'Nenhum parceiro cadastrado'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="lg:hidden space-y-3">
            {filteredPartners.map((partner) => (
              <Card key={partner.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Logo */}
                    {partner.logo ? (
                      <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image src={partner.logo} alt={partner.tradeName || partner.companyName} fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-7 w-7 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold truncate">{partner.tradeName || partner.companyName}</p>
                        <Badge variant={partner.isActive ? "default" : "secondary"} className={partner.isActive ? "bg-green-100 text-green-700 border-0" : ""}>
                          {partner.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="mb-2">{getCategoryLabel(partner.category)}</Badge>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {partner.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {partner.city.name}
                          </span>
                        )}
                        {partner.contact?.whatsapp && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {partner.contact.whatsapp}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/parceiros/${partner.id}/editar`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(partner)}>
                          {partner.isActive ? (
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
                        <DropdownMenuItem onClick={() => handleDeleteClick(partner)} className="text-red-600">
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
                  <TableHead>Empresa</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {partner.logo ? (
                          <div className="relative h-10 w-10 rounded-full overflow-hidden border bg-muted flex-shrink-0">
                            <Image
                              src={partner.logo}
                              alt={partner.tradeName || partner.companyName}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{partner.tradeName || partner.companyName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCNPJ(partner.cnpj)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryLabel(partner.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {partner.city.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {partner.contact.whatsapp}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {partner.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={partner.isActive ? 'default' : 'secondary'} className={partner.isActive ? "bg-green-100 text-green-700 border-0" : ""}>
                        {partner.isActive ? 'Ativo' : 'Inativo'}
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
                            <Link href={`/admin/parceiros/${partner.id}/editar`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(partner)}>
                            {partner.isActive ? (
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
                            onClick={() => handleDeleteClick(partner)}
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
              {selectedPartner ? 'Editar Parceiro' : 'Novo Parceiro'}
            </DialogTitle>
            <DialogDescription>
              {selectedPartner 
                ? 'Altere os dados do parceiro' 
                : 'Preencha os dados para cadastrar um novo parceiro'}
            </DialogDescription>
          </DialogHeader>

          <form 
            onSubmit={handleSubmit(selectedPartner ? onSubmitEdit : onSubmitCreate)} 
            className="space-y-4"
          >
            {/* Dados de acesso (apenas criar) */}
            {!selectedPartner && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email de acesso</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contato@empresa.com"
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

            {/* Dados da empresa */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Razão Social</Label>
                <Input
                  id="companyName"
                  placeholder="Nome da empresa"
                  {...register('companyName')}
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive">{errors.companyName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradeName">Nome Fantasia</Label>
                <Input
                  id="tradeName"
                  placeholder="Nome fantasia (opcional)"
                  {...register('tradeName')}
                />
              </div>
            </div>

            {!selectedPartner && (
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="00000000000000"
                  maxLength={14}
                  {...register('cnpj')}
                />
                {errors.cnpj && (
                  <p className="text-sm text-destructive">{errors.cnpj.message}</p>
                )}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={watch('category')}
                  onValueChange={(value) => setValue('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTNER_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="66999999999"
                  {...register('whatsapp')}
                />
                {errors.whatsapp && (
                  <p className="text-sm text-destructive">{errors.whatsapp.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (opcional)</Label>
                <Input
                  id="phone"
                  placeholder="6633333333"
                  {...register('phone')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descreva a empresa..."
                rows={2}
                {...register('description')}
              />
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
              Tem certeza que deseja excluir o parceiro <strong>{selectedPartner?.companyName}</strong>?
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
