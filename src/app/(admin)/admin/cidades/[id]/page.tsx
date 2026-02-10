'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Save, MapPin, Users, Building2 } from 'lucide-react'
import { toast } from 'sonner'

interface City {
    id: string
    name: string
    state: string
    isActive: boolean
    _count?: {
        assinantes: number
        parceiros: number
    }
}

// Estados brasileiros
const BRAZILIAN_STATES = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' },
]

export default function EditarCidadePage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [city, setCity] = useState<City | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        state: '',
        isActive: true,
    })

    // Carregar cidade
    const fetchCity = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/cities/${id}`)

            if (response.ok) {
                const result = await response.json()
                const data = result.data || result
                setCity(data)
                setFormData({
                    name: data.name || '',
                    state: data.state || '',
                    isActive: data.isActive ?? true,
                })
            } else {
                toast.error('Cidade não encontrada')
                router.push('/admin/cidades')
            }
        } catch (error) {
            console.error('Erro ao carregar cidade:', error)
            toast.error('Erro ao carregar cidade')
        } finally {
            setLoading(false)
        }
    }, [id, router])

    useEffect(() => {
        if (id) fetchCity()
    }, [id, fetchCity])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast.error('Nome é obrigatório')
            return
        }

        if (!formData.state) {
            toast.error('Estado é obrigatório')
            return
        }

        setSaving(true)
        try {
            const response = await fetch(`/api/admin/cities/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Erro ao salvar')
            }

            toast.success('Cidade atualizada com sucesso!')
            router.push('/admin/cidades')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!city) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Cidade não encontrada</p>
                <Button asChild className="mt-4">
                    <Link href="/admin/cidades">Voltar</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/cidades">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Editar Cidade</h1>
                        <p className="text-muted-foreground">Atualize os dados da cidade</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coluna Principal */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações da Cidade</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome da Cidade *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Ex: São Paulo"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="state">Estado *</Label>
                                    <Select
                                        value={formData.state}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BRAZILIAN_STATES.map((state) => (
                                                <SelectItem key={state.value} value={state.value}>
                                                    {state.value} - {state.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Coluna Lateral */}
                    <div className="space-y-6">
                        {/* Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Cidade Ativa</p>
                                        <p className="text-sm text-muted-foreground">
                                            Cidades inativas não aparecem no app
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) =>
                                            setFormData(prev => ({ ...prev, isActive: checked }))
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Preview */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3 p-3 border rounded-lg">
                                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <MapPin className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{formData.name || 'Nome da cidade'}</p>
                                        <Badge variant="outline">{formData.state || 'UF'}</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Informações */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        Assinantes
                                    </span>
                                    <Badge variant="secondary">
                                        {city._count?.assinantes || 0}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <Building2 className="h-4 w-4" />
                                        Parceiros
                                    </span>
                                    <Badge variant="secondary">
                                        {city._count?.parceiros || 0}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Botão Salvar */}
                        <Button type="submit" className="w-full" disabled={saving}>
                            {saving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
