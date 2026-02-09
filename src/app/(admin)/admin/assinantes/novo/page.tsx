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
import { ArrowLeft, Loader2, Save, User } from 'lucide-react'
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
    const [loading, setLoading] = useState(false)
    const [plans, setPlans] = useState<Plan[]>([])
    const [cities, setCities] = useState<City[]>([])
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        cpf: '',
        phone: '',
        planId: '',
        cityId: '',
        subscriptionStatus: 'PENDING',
        password: ''
    })

    // Carregar planos e cidades
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plansRes, citiesRes] = await Promise.all([
                    fetch('/api/admin/planos'),
                    fetch('/api/admin/cities')
                ])

                if (plansRes.ok) {
                    const data = await plansRes.json()
                    setPlans(Array.isArray(data) ? data : data.plans || [])
                }

                if (citiesRes.ok) {
                    const data = await citiesRes.json()
                    setCities(Array.isArray(data) ? data : [])
                }
            } catch (error) {
                console.error('Erro ao carregar dados:', error)
            }
        }

        fetchData()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setError('')
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }))
        setError('')
    }

    // Formatar CPF
    const formatCPF = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        return numbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
            .slice(0, 14)
    }

    // Formatar telefone
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

    const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // Validações básicas
            if (!formData.name.trim()) {
                throw new Error('Nome é obrigatório')
            }
            if (!formData.email.trim()) {
                throw new Error('Email é obrigatório')
            }
            if (!formData.cpf.trim()) {
                throw new Error('CPF é obrigatório')
            }

            const response = await fetch('/api/admin/assinantes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    cpf: formData.cpf.replace(/\D/g, ''),
                    phone: formData.phone.replace(/\D/g, ''),
                    planId: formData.planId || null,
                    cityId: formData.cityId || null
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar assinante')
            }

            toast.success('Assinante criado com sucesso!')
            router.push('/admin/assinantes')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao criar assinante'
            setError(message)
            toast.error(message)
        } finally {
            setLoading(false)
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

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Dados Pessoais */}
                    <Card>
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cpf">CPF *</Label>
                                    <Input
                                        id="cpf"
                                        name="cpf"
                                        value={formData.cpf}
                                        onChange={handleCPFChange}
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
                                        onChange={handlePhoneChange}
                                        placeholder="(00) 00000-0000"
                                        maxLength={15}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Senha (opcional)</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Deixe vazio para gerar automaticamente"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Se não informada, será gerada uma senha aleatória
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assinatura */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Assinatura</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="planId">Plano</Label>
                                <Select
                                    value={formData.planId}
                                    onValueChange={(value) => handleSelectChange('planId', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um plano" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {plans.map((plan) => (
                                            <SelectItem key={plan.id} value={plan.id}>
                                                {plan.name} - R$ {plan.price?.toFixed(2)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subscriptionStatus">Status</Label>
                                <Select
                                    value={formData.subscriptionStatus}
                                    onValueChange={(value) => handleSelectChange('subscriptionStatus', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o status" />
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

                            <div className="space-y-2">
                                <Label htmlFor="cityId">Cidade</Label>
                                <Select
                                    value={formData.cityId}
                                    onValueChange={(value) => handleSelectChange('cityId', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a cidade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cities.map((city) => (
                                            <SelectItem key={city.id} value={city.id}>
                                                {city.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/admin/assinantes">Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? (
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
