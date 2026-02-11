'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Loader2,
    Save,
    Package,
    Copy,
    ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
    id: string
    name: string
    slug: string
    description?: string
    price: number
    priceYearly?: number
    priceSingle?: number
    isActive: boolean
    isFeatured: boolean
    features: string[]
    createdAt: string
}

export default function EditarPlanoPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [plan, setPlan] = useState<Plan | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        price: 0,
        priceYearly: 0,
        priceSingle: 0,
        isActive: true,
        isFeatured: false,
        features: '',
    })

    const fetchPlan = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/plans/${id}`)

            if (response.ok) {
                const data = await response.json()
                setPlan(data)
                setFormData({
                    name: data.name || '',
                    slug: data.slug || '',
                    description: data.description || '',
                    price: data.price || 0,
                    priceYearly: data.priceYearly || 0,
                    priceSingle: data.priceSingle || 0,
                    isActive: data.isActive ?? true,
                    isFeatured: data.isFeatured ?? false,
                    features: Array.isArray(data.features) ? data.features.join('\n') : '',
                })
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

        setSaving(true)
        try {
            const response = await fetch(`/api/admin/plans/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    slug: formData.slug.trim(),
                    description: formData.description.trim() || null,
                    price: formData.price,
                    priceYearly: formData.priceYearly || null,
                    priceSingle: formData.priceSingle || null,
                    isActive: formData.isActive,
                    isFeatured: formData.isFeatured,
                    features: formData.features.split('\n').filter(f => f.trim()),
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Erro ao salvar')
            }

            toast.success('Plano atualizado com sucesso!')
            router.push('/admin/planos')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    const copyCheckoutLink = () => {
        const checkoutUrl = `${window.location.origin}/checkout/${plan?.slug || plan?.id}`
        navigator.clipboard.writeText(checkoutUrl)
        toast.success('Link copiado!')
    }

    const openCheckout = () => {
        const checkoutUrl = `${window.location.origin}/checkout/${plan?.slug || plan?.id}`
        window.open(checkoutUrl, '_blank')
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
                <p className="text-muted-foreground">Plano não encontrado</p>
                <Button asChild className="mt-4">
                    <Link href="/admin/planos">Voltar</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/planos">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">Editar Plano</h1>
                            <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                                {plan.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">{plan.name}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={copyCheckoutLink}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Link
                    </Button>
                    <Button variant="outline" onClick={openCheckout}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir Checkout
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulário Principal */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Informações do Plano
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Nome do plano"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug (URL)</Label>
                                    <Input
                                        id="slug"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleChange}
                                        placeholder="plano-basico"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Descrição do plano..."
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Preços</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Preço Mensal (R$) *</Label>
                                    <Input
                                        id="price"
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleNumberChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="priceYearly">Preço Anual (R$)</Label>
                                    <Input
                                        id="priceYearly"
                                        name="priceYearly"
                                        type="number"
                                        step="0.01"
                                        value={formData.priceYearly}
                                        onChange={handleNumberChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="priceSingle">Pgto Único (R$)</Label>
                                    <Input
                                        id="priceSingle"
                                        name="priceSingle"
                                        type="number"
                                        step="0.01"
                                        value={formData.priceSingle}
                                        onChange={handleNumberChange}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Benefícios</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="features">Lista de benefícios (um por linha)</Label>
                                <Textarea
                                    id="features"
                                    name="features"
                                    value={formData.features}
                                    onChange={handleChange}
                                    placeholder="Acesso ilimitado&#10;Suporte prioritário&#10;Descontos exclusivos"
                                    rows={6}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configurações</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Plano Ativo</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Visível no checkout
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Plano Destaque</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Destacado na página
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.isFeatured}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Link do Checkout</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-3 bg-gray-50 rounded-lg text-sm font-mono break-all">
                                {`${typeof window !== 'undefined' ? window.location.origin : ''}/checkout/${plan.slug || plan.id}`}
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        className="w-full"
                        onClick={handleSave}
                        disabled={saving}
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
