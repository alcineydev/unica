'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    ArrowLeft,
    Loader2,
    Save,
    User,
    CreditCard,
    MapPin,
    Lock,
    Eye,
    EyeOff,
    Mail
} from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
    id: string
    name: string
    price: number
}

interface City {
    id: string
    name: string
}

const SUBSCRIPTION_STATUS = [
    { value: 'PENDING', label: 'Pendente' },
    { value: 'ACTIVE', label: 'Ativo' },
    { value: 'INACTIVE', label: 'Inativo' },
    { value: 'GUEST', label: 'Convidado' },
]

export default function NovoAssinantePage() {
    const router = useRouter()

    // Estados de dados
    const [plans, setPlans] = useState<Plan[]>([])
    const [cities, setCities] = useState<City[]>([])
    const [loadingData, setLoadingData] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        cpf: '',
        phone: '',
        password: '',
        planId: '',
        cityId: '',
        subscriptionStatus: 'PENDING',
    })

    // Carregar planos e cidades
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingData(true)
                const [plansRes, citiesRes] = await Promise.all([
                    fetch('/api/admin/plans'),
                    fetch('/api/admin/cities')
                ])

                if (plansRes.ok) {
                    const data = await plansRes.json()
                    setPlans(Array.isArray(data) ? data : data.data || [])
                }

                if (citiesRes.ok) {
                    const data = await citiesRes.json()
                    setCities(Array.isArray(data) ? data : [])
                }
            } catch (error) {
                console.error('Erro ao carregar dados:', error)
            } finally {
                setLoadingData(false)
            }
        }

        fetchData()
    }, [])

    // Formatadores
    const formatCPF = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        return numbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
            .slice(0, 14)
    }

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        if (numbers.length <= 10) {
            return numbers
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2')
        }
        return numbers
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .slice(0, 15)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        if (name === 'cpf') {
            setFormData(prev => ({ ...prev, cpf: formatCPF(value) }))
        } else if (name === 'phone') {
            setFormData(prev => ({ ...prev, phone: formatPhone(value) }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
        setError('')
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value === 'none' ? '' : value }))
        setError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')

        try {
            // Validações
            if (!formData.name.trim()) {
                throw new Error('Nome completo é obrigatório')
            }
            if (!formData.email.includes('@')) {
                throw new Error('E-mail válido é obrigatório')
            }
            if (!formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11) {
                throw new Error('CPF válido é obrigatório (11 dígitos)')
            }
            if (!formData.password || formData.password.length < 6) {
                throw new Error('Senha é obrigatória (mínimo 6 caracteres)')
            }

            const response = await fetch('/api/admin/assinantes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.trim().toLowerCase(),
                    cpf: formData.cpf.replace(/\D/g, ''),
                    phone: formData.phone.replace(/\D/g, ''),
                    password: formData.password,
                    planId: formData.planId || null,
                    cityId: formData.cityId || null,
                    subscriptionStatus: formData.subscriptionStatus,
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar assinante')
            }

            toast.success('Assinante criado com sucesso! E-mail de boas-vindas enviado.')
            router.push('/admin/assinantes')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao criar assinante'
            setError(message)
            toast.error(message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Novo Assinante</h1>
                    <p className="text-sm text-muted-foreground">
                        Cadastre um novo assinante no clube
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/admin/assinantes">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Link>
                </Button>
            </div>

            {/* Aviso sobre email */}
            <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                    Ao criar o assinante, um <strong>e-mail de boas-vindas</strong> será enviado automaticamente com os dados de acesso.
                </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Dados Pessoais */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Dados Pessoais
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Nome do assinante"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="email@exemplo.com"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cpf">CPF *</Label>
                                    <Input
                                        id="cpf"
                                        name="cpf"
                                        value={formData.cpf}
                                        onChange={handleChange}
                                        placeholder="000.000.000-00"
                                        maxLength={14}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="(00) 00000-0000"
                                        maxLength={15}
                                    />
                                </div>
                            </div>

                            {/* Senha OBRIGATÓRIA */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="flex items-center gap-2">
                                    <Lock className="h-4 w-4" />
                                    Senha *
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    O assinante receberá esta senha por e-mail.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assinatura */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Assinatura
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Plano */}
                            <div className="space-y-2">
                                <Label>Plano</Label>
                                {loadingData ? (
                                    <div className="flex items-center gap-2 h-10 px-3 border rounded-md">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm text-muted-foreground">Carregando...</span>
                                    </div>
                                ) : (
                                    <Select
                                        value={formData.planId || 'none'}
                                        onValueChange={(value) => handleSelectChange('planId', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um plano" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sem plano</SelectItem>
                                            {plans.map((plan) => (
                                                <SelectItem key={plan.id} value={plan.id}>
                                                    {plan.name} - R$ {Number(plan.price).toFixed(2)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                {!loadingData && plans.length === 0 && (
                                    <p className="text-xs text-amber-600">
                                        Nenhum plano encontrado. <Link href="/admin/planos/novo" className="underline">Criar plano</Link>
                                    </p>
                                )}
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.subscriptionStatus}
                                    onValueChange={(value) => handleSelectChange('subscriptionStatus', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SUBSCRIPTION_STATUS.map((status) => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Cidade */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Cidade
                                </Label>
                                {loadingData ? (
                                    <div className="flex items-center gap-2 h-10 px-3 border rounded-md">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm text-muted-foreground">Carregando...</span>
                                    </div>
                                ) : (
                                    <Select
                                        value={formData.cityId || 'none'}
                                        onValueChange={(value) => handleSelectChange('cityId', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a cidade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Não informada</SelectItem>
                                            {cities.map((city) => (
                                                <SelectItem key={city.id} value={city.id}>
                                                    {city.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/admin/assinantes">Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Criar Assinante
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
