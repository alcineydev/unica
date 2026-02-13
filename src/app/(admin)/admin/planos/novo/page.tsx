'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  Loader2,
  Info,
  DollarSign,
  List,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PlanBenefitsSelector } from '@/components/admin/plan-benefits-selector'

interface Benefit {
  id: string
  name: string
  description?: string
  type?: string
}

export default function NovoPlanoPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [allBenefits, setAllBenefits] = useState<Benefit[]>([])
  const [selectedBenefitIds, setSelectedBenefitIds] = useState<string[]>([])
  const [loadingBenefits, setLoadingBenefits] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    priceYearly: 0,
    priceSingle: 0,
    period: 'MONTHLY',
    isActive: true,
    features: '',
  })

  // Carregar benefícios disponíveis
  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        const response = await fetch('/api/admin/benefits')
        if (response.ok) {
          const data = await response.json()
          const list = Array.isArray(data) ? data : data.data || []
          setAllBenefits(list)
        }
      } catch (error) {
        console.error('Erro ao carregar benefícios:', error)
      } finally {
        setLoadingBenefits(false)
      }
    }
    fetchBenefits()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }))
  }

  // Gerar slug automaticamente a partir do nome
  const handleNameChange = (value: string) => {
    const slug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    setFormData(prev => ({
      ...prev,
      name: value,
      slug,
    }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const handleSubmit = async () => {
    // Validações
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      toast.error('Descrição deve ter no mínimo 10 caracteres')
      return
    }

    if (formData.price <= 0) {
      toast.error('Preço mensal deve ser maior que zero')
      return
    }

    if (selectedBenefitIds.length === 0) {
      toast.error('Selecione pelo menos um benefício')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim() || undefined,
          description: formData.description.trim(),
          price: formData.price,
          priceYearly: formData.priceYearly > 0 ? formData.priceYearly : null,
          priceSingle: formData.priceSingle > 0 ? formData.priceSingle : null,
          isActive: formData.isActive,
          benefitIds: selectedBenefitIds,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Mostrar detalhes de validação se disponíveis
        if (data.details) {
          const firstError = Object.values(data.details).flat()[0]
          throw new Error(String(firstError) || data.error || 'Erro ao criar plano')
        }
        throw new Error(data.error || 'Erro ao criar plano')
      }

      toast.success('Plano criado com sucesso!')
      router.push('/admin/planos')
    } catch (error) {
      console.error('Erro ao criar plano:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar plano')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
            <Link href="/admin/planos">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Novo Plano</h1>
            <p className="text-muted-foreground text-sm">
              Crie um novo plano de assinatura para o clube
            </p>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Criar Plano
        </Button>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Informações do Plano
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nome do Plano <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex: Plano Premium"
                    className="h-11"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL do Checkout)</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="plano-premium"
                    className="h-11"
                    disabled={saving}
                  />
                  <p className="text-xs text-muted-foreground">
                    Gerado automaticamente a partir do nome
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Descrição <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Descreva os principais benefícios do plano... (mín. 10 caracteres)"
                  rows={3}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preços */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Preços
              </CardTitle>
              <CardDescription>
                Configure os valores para diferentes períodos de cobrança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">
                    Preço Mensal <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price || ''}
                      onChange={handleNumberChange}
                      className="pl-10 h-11"
                      placeholder="29.90"
                      disabled={saving}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceYearly">Preço Anual</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <Input
                      id="priceYearly"
                      name="priceYearly"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.priceYearly || ''}
                      onChange={handleNumberChange}
                      className="pl-10 h-11"
                      placeholder="299.00"
                      disabled={saving}
                    />
                  </div>
                  {formData.priceYearly > 0 && formData.price > 0 && (
                    <p className="text-xs text-green-600">
                      Economia de {formatCurrency((formData.price * 12) - formData.priceYearly)} /ano
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceSingle">Pagamento Único</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <Input
                      id="priceSingle"
                      name="priceSingle"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.priceSingle || ''}
                      onChange={handleNumberChange}
                      className="pl-10 h-11"
                      placeholder="999.00"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {/* Preview de Preços */}
              {formData.price > 0 && (
                <div className="mt-6 p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm font-medium mb-3">Preview de Preços:</p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(formData.price)}
                      </span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                    {formData.priceYearly > 0 && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold text-green-600">
                          {formatCurrency(formData.priceYearly)}
                        </span>
                        <span className="text-sm text-muted-foreground">/ano</span>
                      </div>
                    )}
                    {formData.priceSingle > 0 && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold text-purple-600">
                          {formatCurrency(formData.priceSingle)}
                        </span>
                        <span className="text-sm text-muted-foreground">único</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Benefícios */}
          {loadingBenefits ? (
            <Card>
              <CardContent className="py-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span className="text-muted-foreground">Carregando benefícios...</span>
              </CardContent>
            </Card>
          ) : (
            <PlanBenefitsSelector
              allBenefits={allBenefits}
              selectedBenefitIds={selectedBenefitIds}
              onChange={setSelectedBenefitIds}
            />
          )}

          {/* Features (Bullets de Marketing) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Lista de Recursos
              </CardTitle>
              <CardDescription>
                Bullets que aparecem na página de checkout (um por linha)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="features"
                name="features"
                value={formData.features}
                onChange={handleChange}
                placeholder={"✓ Acesso ilimitado aos benefícios\n✓ Suporte prioritário 24/7\n✓ Descontos exclusivos em parceiros\n✓ Cashback em todas as compras"}
                rows={6}
                className="font-mono text-sm"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Dica: Use emojis como ✓, ✔️, ⭐ para destacar os itens
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Configurações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Switch: Plano Ativo */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Plano Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Visível no checkout para novos assinantes
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-medium truncate max-w-[150px]">
                  {formData.name || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Preço mensal</span>
                <span className="font-medium">
                  {formData.price > 0 ? formatCurrency(formData.price) : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Benefícios</span>
                <span className="font-medium">{selectedBenefitIds.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-medium ${formData.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  {formData.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Botão Criar (mobile/tablet) */}
          <Button
            className="w-full lg:hidden"
            onClick={handleSubmit}
            disabled={saving}
            size="lg"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Criar Plano
          </Button>
        </div>
      </div>
    </div>
  )
}
