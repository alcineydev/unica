'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  Loader2,
  Gift,
  Percent,
  Coins,
  Star,
  Lock,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

const benefitTypes = [
  { value: 'DESCONTO', label: 'Desconto', icon: Percent, description: 'Porcentagem ou valor fixo de desconto' },
  { value: 'CASHBACK', label: 'Cashback', icon: Coins, description: 'Retorno em dinheiro ou crédito' },
  { value: 'PONTOS', label: 'Pontos', icon: Star, description: 'Acumule pontos para trocar por prêmios' },
  { value: 'ACESSO_EXCLUSIVO', label: 'Acesso Exclusivo', icon: Lock, description: 'Acesso a áreas ou serviços exclusivos' },
]

interface Category {
  id: string
  name: string
}

interface Benefit {
  id: string
  name: string
  description: string
  type: string
  value: Record<string, unknown>
  category: string | null
  isActive: boolean
}

export default function EditarBeneficioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [notFound, setNotFound] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'DESCONTO',
    category: '',
    isActive: true,
    discountType: 'percentage',
    discountValue: '',
    cashbackPercentage: '',
    pointsMultiplier: '',
    accessDescription: '',
  })

  // Carregar benefício e categorias
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carregar categorias
        const catResponse = await fetch('/api/admin/categories')
        if (catResponse.ok) {
          const catData = await catResponse.json()
          setCategories(catData.data || catData || [])
        }

        // Carregar benefício
        const response = await fetch(`/api/admin/benefits/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setNotFound(true)
            return
          }
          throw new Error('Erro ao carregar benefício')
        }

        const benefit: Benefit = await response.json()
        
        // Preencher formulário
        setFormData({
          name: benefit.name,
          description: benefit.description,
          type: benefit.type,
          category: benefit.category || '',
          isActive: benefit.isActive,
          discountType: (benefit.value as { type?: string })?.type || 'percentage',
          discountValue: String((benefit.value as { value?: number })?.value || ''),
          cashbackPercentage: String((benefit.value as { percentage?: number })?.percentage || ''),
          pointsMultiplier: String((benefit.value as { multiplier?: number })?.multiplier || ''),
          accessDescription: (benefit.value as { description?: string })?.description || '',
        })
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast.error('Erro ao carregar benefício')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const buildValueObject = () => {
    switch (formData.type) {
      case 'DESCONTO':
        return {
          type: formData.discountType,
          value: parseFloat(formData.discountValue) || 0,
        }
      case 'CASHBACK':
        return {
          percentage: parseFloat(formData.cashbackPercentage) || 0,
        }
      case 'PONTOS':
        return {
          multiplier: parseFloat(formData.pointsMultiplier) || 1,
        }
      case 'ACESSO_EXCLUSIVO':
        return {
          description: formData.accessDescription,
        }
      default:
        return {}
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Descrição é obrigatória')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/benefits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          type: formData.type,
          category: formData.category || null,
          value: buildValueObject(),
          isActive: formData.isActive,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar benefício')
      }

      toast.success('Benefício atualizado com sucesso!')
      router.push('/admin/beneficios')
    } catch (error) {
      console.error('Erro ao atualizar benefício:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar benefício')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/benefits/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao excluir benefício')
      }

      toast.success('Benefício excluído com sucesso!')
      router.push('/admin/beneficios')
    } catch (error) {
      console.error('Erro ao excluir benefício:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir benefício')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Gift className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Benefício não encontrado</h2>
        <p className="text-muted-foreground mt-1">
          O benefício que você procura não existe ou foi removido.
        </p>
        <Button asChild className="mt-4">
          <Link href="/admin/beneficios">Voltar para lista</Link>
        </Button>
      </div>
    )
  }

  const selectedType = benefitTypes.find(t => t.value === formData.type)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/beneficios">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Benefício</h1>
            <p className="text-muted-foreground">
              Atualize as informações do benefício
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={saving || deleting}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
              <CardDescription>
                Dados principais do benefício
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: 10% de desconto"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Descrição <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o benefício..."
                  rows={3}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Benefício ativo e disponível para uso
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tipo e Valor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedType && <selectedType.icon className="h-5 w-5" />}
                Tipo do Benefício
              </CardTitle>
              <CardDescription>
                Configure o tipo e valor do benefício
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  {benefitTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                        formData.type === type.value
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:border-muted-foreground/50'
                      }`}
                      disabled={saving}
                    >
                      <type.icon className={`h-6 w-6 ${formData.type === type.value ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${formData.type === type.value ? 'text-primary' : ''}`}>
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {formData.type === 'DESCONTO' && (
                <>
                  <div className="space-y-2">
                    <Label>Tipo de Desconto</Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(value) => setFormData({ ...formData, discountType: value })}
                      disabled={saving}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Valor {formData.discountType === 'percentage' ? '(%)' : '(R$)'}
                    </Label>
                    <Input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      placeholder={formData.discountType === 'percentage' ? 'Ex: 10' : 'Ex: 50.00'}
                      min="0"
                      step={formData.discountType === 'percentage' ? '1' : '0.01'}
                      disabled={saving}
                    />
                  </div>
                </>
              )}

              {formData.type === 'CASHBACK' && (
                <div className="space-y-2">
                  <Label>Porcentagem de Cashback (%)</Label>
                  <Input
                    type="number"
                    value={formData.cashbackPercentage}
                    onChange={(e) => setFormData({ ...formData, cashbackPercentage: e.target.value })}
                    placeholder="Ex: 5"
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={saving}
                  />
                </div>
              )}

              {formData.type === 'PONTOS' && (
                <div className="space-y-2">
                  <Label>Multiplicador de Pontos</Label>
                  <Input
                    type="number"
                    value={formData.pointsMultiplier}
                    onChange={(e) => setFormData({ ...formData, pointsMultiplier: e.target.value })}
                    placeholder="Ex: 2 (dobro de pontos)"
                    min="1"
                    step="0.5"
                    disabled={saving}
                  />
                </div>
              )}

              {formData.type === 'ACESSO_EXCLUSIVO' && (
                <div className="space-y-2">
                  <Label>Descrição do Acesso</Label>
                  <Textarea
                    value={formData.accessDescription}
                    onChange={(e) => setFormData({ ...formData, accessDescription: e.target.value })}
                    placeholder="Descreva o que está incluído..."
                    rows={3}
                    disabled={saving}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild disabled={saving}>
            <Link href="/admin/beneficios">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Dialog de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Benefício</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este benefício? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
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
