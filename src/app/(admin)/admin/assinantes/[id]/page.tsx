'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  Loader2,
  History,
  QrCode,
  Wallet,
  Crown,
  Star
} from 'lucide-react'
import { toast } from 'sonner'

interface Assinante {
  id: string
  name: string
  email: string
  phone: string
  cpf: string
  avatar?: string
  dataNascimento?: string
  endereco?: {
    cep?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    estado?: string
  }
  subscriptionStatus: string
  points: number
  cashback: number
  qrCode?: string
  plan?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

interface Plan {
  id: string
  name: string
}

export default function AssinanteDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [assinante, setAssinante] = useState<Assinante | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<Assinante>>({})

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const assinanteRes = await fetch(`/api/admin/assinantes/${id}`)
      const assinanteData = await assinanteRes.json()

      if (assinanteData.error) {
        toast.error(assinanteData.error)
        router.push('/admin/assinantes')
        return
      }

      setAssinante(assinanteData.assinante)
      setFormData(assinanteData.assinante)

      // Buscar planos - usando API publica que nao requer auth
      const plansRes = await fetch('/api/public/plans')
      const plansData = await plansRes.json()

      // A resposta e { plans: [...] }
      if (Array.isArray(plansData)) {
        setPlans(plansData)
      } else if (plansData.plans) {
        setPlans(plansData.plans)
      } else {
        setPlans([])
      }

    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateEndereco = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      endereco: { ...prev.endereco, [field]: value }
    }))
  }

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 8)
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  const buscarCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: {
            ...prev.endereco,
            cep: cep,
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || ''
          }
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const response = await fetch(`/api/admin/assinantes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone?.replace(/\D/g, ''),
          cpf: formData.cpf?.replace(/\D/g, ''),
          endereco: formData.endereco,
          subscriptionStatus: formData.subscriptionStatus,
          planId: formData.plan?.id || null
          // Pontos e cashback nao sao editaveis manualmente
        })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erro ao salvar')
        return
      }

      toast.success('Assinante atualizado com sucesso!')
      fetchData()

    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar alteracoes')
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'EXPIRED': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Ativo'
      case 'PENDING': return 'Pendente'
      case 'INACTIVE': return 'Inativo'
      case 'CANCELLED': return 'Cancelado'
      case 'EXPIRED': return 'Expirado'
      default: return status
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (!assinante) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Assinante nao encontrado</p>
        <Link href="/admin/assinantes">
          <Button variant="link">Voltar para lista</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/assinantes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Editar Assinante</h1>
            <p className="text-muted-foreground">Gerencie os dados do assinante</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alteracoes
            </>
          )}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={assinante.avatar} />
                  <AvatarFallback className="text-2xl bg-primary/10">
                    {assinante.name?.charAt(0)?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h2 className="text-xl font-semibold">{assinante.name}</h2>
              <p className="text-muted-foreground">{assinante.email}</p>
              <Badge className={`mt-3 ${getStatusColor(assinante.subscriptionStatus)}`}>
                {getStatusLabel(assinante.subscriptionStatus)}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Plano Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assinante.plan ? (
                <div className="text-lg font-semibold">{assinante.plan.name}</div>
              ) : (
                <div className="text-muted-foreground">Sem plano</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Saldo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pontos</span>
                <span className="font-semibold">{assinante.points || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cashback</span>
                <span className="font-semibold">R$ {Number(assinante.cashback || 0).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Informacoes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{new Date(assinante.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Atualizado em</span>
                <span>{new Date(assinante.updatedAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="dados" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
                  <TabsTrigger value="endereco">Endereco</TabsTrigger>
                  <TabsTrigger value="assinatura">Assinatura</TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          className="pl-10"
                          value={formData.name || ''}
                          onChange={(e) => updateField('name', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          className="pl-10"
                          value={formData.email || ''}
                          disabled
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Email nao pode ser alterado</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="cpf"
                          className="pl-10"
                          value={formData.cpf ? maskCPF(formData.cpf) : ''}
                          onChange={(e) => updateField('cpf', e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          className="pl-10"
                          value={formData.phone ? maskPhone(formData.phone) : ''}
                          onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dataNascimento"
                        type="date"
                        className="pl-10"
                        value={formData.dataNascimento || ''}
                        onChange={(e) => updateField('dataNascimento', e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="endereco" className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        value={formData.endereco?.cep ? maskCEP(formData.endereco.cep) : ''}
                        onChange={(e) => {
                          updateEndereco('cep', e.target.value.replace(/\D/g, ''))
                          if (e.target.value.replace(/\D/g, '').length === 8) {
                            buscarCEP(e.target.value)
                          }
                        }}
                        placeholder="00000-000"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="logradouro">Logradouro</Label>
                      <Input
                        id="logradouro"
                        value={formData.endereco?.logradouro || ''}
                        onChange={(e) => updateEndereco('logradouro', e.target.value)}
                        placeholder="Rua, Avenida..."
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numero">Numero</Label>
                      <Input
                        id="numero"
                        value={formData.endereco?.numero || ''}
                        onChange={(e) => updateEndereco('numero', e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-3 space-y-2">
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input
                        id="complemento"
                        value={formData.endereco?.complemento || ''}
                        onChange={(e) => updateEndereco('complemento', e.target.value)}
                        placeholder="Apto, Bloco..."
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        value={formData.endereco?.bairro || ''}
                        onChange={(e) => updateEndereco('bairro', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={formData.endereco?.cidade || ''}
                        onChange={(e) => updateEndereco('cidade', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Input
                        id="estado"
                        value={formData.endereco?.estado || ''}
                        onChange={(e) => updateEndereco('estado', e.target.value.toUpperCase())}
                        maxLength={2}
                        placeholder="UF"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="assinatura" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status da Assinatura</Label>
                      <Select
                        value={formData.subscriptionStatus}
                        onValueChange={(value) => updateField('subscriptionStatus', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pendente</SelectItem>
                          <SelectItem value="ACTIVE">Ativo</SelectItem>
                          <SelectItem value="INACTIVE">Inativo</SelectItem>
                          <SelectItem value="CANCELLED">Cancelado</SelectItem>
                          <SelectItem value="EXPIRED">Expirado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plan">Plano</Label>
                      <Select
                        value={formData.plan?.id || 'none'}
                        onValueChange={(value) => {
                          if (value === 'none') {
                            updateField('plan', null)
                          } else {
                            const plan = plans.find(p => p.id === value)
                            updateField('plan', plan)
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o plano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem plano</SelectItem>
                          {plans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pontos Acumulados</Label>
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <span className="text-2xl font-bold">{assinante?.points || 0}</span>
                        <span className="text-muted-foreground">pontos</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Pontos sao acumulados automaticamente nas validacoes
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Cashback Disponivel</Label>
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Wallet className="h-5 w-5 text-green-500" />
                        <span className="text-2xl font-bold">
                          R$ {Number(assinante?.cashback || 0).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cashback e creditado automaticamente nas compras
                      </p>
                    </div>
                  </div>

                  {assinante.qrCode && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label>QR Code</Label>
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <QrCode className="h-5 w-5 text-muted-foreground" />
                          <code className="text-sm">{assinante.qrCode}</code>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
