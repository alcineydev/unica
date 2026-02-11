'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Loader2,
    Save,
    Package,
    Copy,
    ExternalLink,
    Info,
    DollarSign,
    List,
    Settings,
    Link2,
    Calendar,
    Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PlanStatsCards } from '@/components/admin/plan-stats-cards'
import { PlanBenefitsSelector } from '@/components/admin/plan-benefits-selector'
import { PlanTimelineChart } from '@/components/admin/plan-timeline-chart'

interface Benefit {
    id: string
    name: string
    description?: string
    type?: string
}

interface PlanBenefit {
    id: string
    benefitId: string
    benefit: Benefit
}

interface TimelineData {
    month: string
    label: string
    count: number
}

interface PlanData {
    id: string
    name: string
    slug: string
    description?: string
    price: number
    priceYearly?: number
    priceSingle?: number
    period: string
    features: string[]
    isActive: boolean
    createdAt: string
    updatedAt: string
    planBenefits: PlanBenefit[]
    allBenefits: Benefit[]
    stats: {
        totalAssinantes: number
        assinantesAtivos: number
        assinantesPendentes: number
        assinantesSuspensos: number
        assinantesExpirados: number
        receitaMensal: number
        receitaAnual: number
        novosEsteMes: number
        timeline: TimelineData[]
        statusDistribution: Array<{ status: string; count: number }>
    }
    _count: {
        assinantes: number
        planBenefits: number
    }
}

export default function EditarPlanoPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [plan, setPlan] = useState<PlanData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

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

    const [selectedBenefitIds, setSelectedBenefitIds] = useState<string[]>([])

    // Carregar plano
    const fetchPlan = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/plans/${id}`)

            if (response.ok) {
                const data: PlanData = await response.json()
                setPlan(data)

                setFormData({
                    name: data.name || '',
                    slug: data.slug || '',
                    description: data.description || '',
                    price: Number(data.price) || 0,
                    priceYearly: Number(data.priceYearly) || 0,
                    priceSingle: Number(data.priceSingle) || 0,
                    period: data.period || 'MONTHLY',
                    isActive: data.isActive ?? true,
                    features: Array.isArray(data.features) ? data.features.join('\n') : '',
                })

                // Setar benefícios selecionados
                const benefitIds = data.planBenefits?.map(pb => pb.benefitId) || []
                setSelectedBenefitIds(benefitIds)
            } else {
                toast.error('Plano não encontrado')
                router.push('/admin/planos')
            }
        } catch (error) {
            console.error('Erro ao carregar plano:', error)
            toast.error('Erro ao carregar plano')
        } finally {
            setLoading(false)
        }
    }, [id, router])

    useEffect(() => {
        if (id) fetchPlan()
    }, [id, fetchPlan])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }))
    }

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Nome é obrigatório')
            return
        }

        if (formData.price <= 0) {
            toast.error('Preço mensal deve ser maior que zero')
            return
        }

        setSaving(true)
        try {
            const response = await fetch(`/api/admin/plans/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    slug: formData.slug.trim() || formData.name.trim().toLowerCase().replace(/\s+/g, '-'),
                    description: formData.description.trim() || null,
                    price: formData.price,
                    priceYearly: formData.priceYearly || null,
                    priceSingle: formData.priceSingle || null,
                    period: formData.period,
                    isActive: formData.isActive,
                    features: formData.features.split('\n').filter(f => f.trim()),
                    benefitIds: selectedBenefitIds,
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Erro ao salvar')
            }

            toast.success('Plano atualizado com sucesso!')
            fetchPlan() // Recarregar dados atualizados
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    const copyCheckoutLink = () => {
        const checkoutUrl = `${window.location.origin}/checkout/${plan?.slug || plan?.id}`
        navigator.clipboard.writeText(checkoutUrl)
        toast.success('Link copiado para a área de transferência!')
    }

    const openCheckout = () => {
        const checkoutUrl = `${window.location.origin}/checkout/${plan?.slug || plan?.id}`
        window.open(checkoutUrl, '_blank')
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!plan) {
        return (
            <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Plano não encontrado</p>
                <Button asChild>
                    <Link href="/admin/planos">Voltar para Planos</Link>
                </Button>
            </div>
        )
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
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-bold">{plan.name}</h1>
                            <Badge
                                variant={plan.isActive ? 'default' : 'secondary'}
                                className={plan.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                            >
                                {plan.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Criado em {format(new Date(plan.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={copyCheckoutLink}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Link
                    </Button>
                    <Button variant="outline" size="sm" onClick={openCheckout}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir Checkout
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar Alterações
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <PlanStatsCards
                totalAssinantes={plan.stats.totalAssinantes}
                assinantesAtivos={plan.stats.assinantesAtivos}
                receitaMensal={plan.stats.receitaMensal}
                novosEsteMes={plan.stats.novosEsteMes}
            />

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
                                    <Label htmlFor="name">Nome do Plano *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Ex: Plano Premium"
                                        className="h-11"
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
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Deixe vazio para gerar automaticamente
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Descreva os principais benefícios do plano..."
                                    rows={3}
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
                                    <Label htmlFor="price">Preço Mensal *</Label>
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
                                            value={formData.price}
                                            onChange={handleNumberChange}
                                            className="pl-10 h-11"
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
                                            value={formData.priceYearly}
                                            onChange={handleNumberChange}
                                            className="pl-10 h-11"
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
                                            value={formData.priceSingle}
                                            onChange={handleNumberChange}
                                            className="pl-10 h-11"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Preview de Preços */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
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
                        </CardContent>
                    </Card>

                    {/* Benefícios */}
                    <PlanBenefitsSelector
                        allBenefits={plan.allBenefits || []}
                        selectedBenefitIds={selectedBenefitIds}
                        onChange={setSelectedBenefitIds}
                    />

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
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Plano Ativo</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Visível no checkout para novos assinantes
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={formData.isActive}
                                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                    className={`
                    relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 
                    focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                    ${formData.isActive ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                                >
                                    <span
                                        className={`
                      pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg 
                      ring-0 transition duration-200 ease-in-out
                      ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}
                    `}
                                    />
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Link do Checkout */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Link2 className="h-5 w-5" />
                                Link do Checkout
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="p-3 bg-gray-50 rounded-lg break-all">
                                <code className="text-xs text-gray-700">
                                    {typeof window !== 'undefined'
                                        ? `${window.location.origin}/checkout/${plan.slug || plan.id}`
                                        : `/checkout/${plan.slug || plan.id}`
                                    }
                                </code>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1" onClick={copyCheckoutLink}>
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copiar
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1" onClick={openCheckout}>
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Abrir
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gráfico Timeline */}
                    {plan.stats.timeline && plan.stats.timeline.length > 0 && (
                        <PlanTimelineChart data={plan.stats.timeline} />
                    )}

                    {/* Resumo */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Resumo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Assinantes
                                </span>
                                <span className="font-medium">{plan._count.assinantes}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Benefícios vinculados</span>
                                <span className="font-medium">{selectedBenefitIds.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Criado em
                                </span>
                                <span className="font-medium">
                                    {format(new Date(plan.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Última atualização</span>
                                <span className="font-medium">
                                    {format(new Date(plan.updatedAt), 'dd/MM/yyyy', { locale: ptBR })}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Botão Salvar (mobile/tablet) */}
                    <Button
                        className="w-full lg:hidden"
                        onClick={handleSave}
                        disabled={saving}
                        size="lg"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar Alterações
                    </Button>
                </div>
            </div>
        </div>
    )
}
