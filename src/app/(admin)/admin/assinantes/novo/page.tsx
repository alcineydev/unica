'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { ArrowLeft, Loader2, UserPlus, Mail, Phone, CreditCard, Shield } from 'lucide-react'

interface Plan {
  id: string
  name: string
  price: number
  isActive?: boolean
}

interface City {
  id: string
  name: string
  state: string
}

export default function NovoAssinantePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [cities, setCities] = useState<City[]>([])

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
    planId: '',
    cityId: '',
    status: 'PENDING',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, citiesRes] = await Promise.all([
          fetch('/api/admin/plans?includeInactive=true'),
          fetch('/api/admin/cities'),
        ])

        if (plansRes.ok) {
          const data = await plansRes.json()
          const list = Array.isArray(data) ? data : data.data || []
          setPlans(list)
        }

        if (citiesRes.ok) {
          const data = await citiesRes.json()
          setCities(Array.isArray(data) ? data : data.data || [])
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }
    fetchData()
  }, [])

  // Máscara CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  // Máscara Telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (!formData.email.trim()) {
      toast.error('Email é obrigatório')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/assinantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          cpf: formData.cpf.replace(/\D/g, '') || undefined,
          phone: formData.phone.replace(/\D/g, '') || undefined,
          password: formData.password || undefined,
          planId: formData.planId || undefined,
          cityId: formData.cityId || undefined,
          status: formData.status,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar assinante')
      }

      toast.success('Assinante criado com sucesso!')

      // Redirecionar para edição (padrão parceiros)
      const assinanteId = data.data?.id || data.id
      if (assinanteId) {
        router.push(`/admin/assinantes/${assinanteId}`)
      } else {
        router.push('/admin/assinantes')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar assinante')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/assinantes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Novo Assinante</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre os dados principais. Depois você poderá editar todos os detalhes.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Card: Dados Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Dados Principais
              </CardTitle>
              <CardDescription>
                Informações obrigatórias do assinante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">
                    Nome Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Nome do assinante"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5" /> CPF
                  </Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    disabled={loading}
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> Telefone
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    disabled={loading}
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" /> Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Deixe vazio para senha padrão"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Se vazio, será gerada: Unica@2025
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Plano e Localização */}
          <Card>
            <CardHeader>
              <CardTitle>Plano e Localização</CardTitle>
              <CardDescription>
                Opcionais - podem ser definidos depois na edição
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select
                    value={formData.planId || 'none'}
                    onValueChange={(value) =>
                      setFormData({ ...formData, planId: value === 'none' ? '' : value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem plano</SelectItem>
                      {plans
                        .filter((p) => p.isActive !== false)
                        .map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - R$ {Number(plan.price).toFixed(2)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Select
                    value={formData.cityId || 'none'}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cityId: value === 'none' ? '' : value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não definida</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name} - {city.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status Inicial</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="ACTIVE">Ativo</SelectItem>
                      <SelectItem value="GUEST">Convidado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" asChild disabled={loading}>
            <Link href="/admin/assinantes">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Criar Assinante
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
