'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Loader2,
  Save,
  User,
  CreditCard,
  MapPin,
  Calendar,
  QrCode,
  Star,
  TrendingUp,
  ShoppingBag,
  Wallet,
  Gift,
  Building2,
  Copy,
  ExternalLink,
  Receipt,
  PiggyBank,
  Download
} from 'lucide-react'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'

// Tipos
interface Plan {
  id: string
  name: string
  price: number
  description?: string
}

interface City {
  id: string
  name: string
}

interface Parceiro {
  id: string
  tradeName?: string
  companyName: string
  logo?: string
}

interface Transaction {
  id: string
  type: string
  amount: number
  discountApplied: number
  cashbackGenerated: number
  pointsUsed: number
  description?: string
  status: string
  createdAt: string
  parceiro?: Parceiro
}

interface AssinanteData {
  id: string
  name: string
  cpf: string
  phone?: string
  birthDate?: string
  qrCode: string
  points: number
  cashback: number
  subscriptionStatus: string
  address?: any
  createdAt: string
  user?: {
    id: string
    name: string
    email: string
    avatar?: string
    createdAt: string
  }
  plan?: Plan
  city?: City
  transactions?: Transaction[]
  stats?: {
    totalTransactions: number
    totalSpent: number
    totalSaved: number
    totalCashback: number
    totalPointsUsed: number
  }
}

const SUBSCRIPTION_STATUS = [
  { value: 'PENDING', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ACTIVE', label: 'Ativo', color: 'bg-green-100 text-green-800' },
  { value: 'INACTIVE', label: 'Inativo', color: 'bg-gray-100 text-gray-800' },
  { value: 'SUSPENDED', label: 'Suspenso', color: 'bg-orange-100 text-orange-800' },
  { value: 'CANCELED', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  { value: 'EXPIRED', label: 'Expirado', color: 'bg-purple-100 text-purple-800' },
  { value: 'GUEST', label: 'Convidado', color: 'bg-blue-100 text-blue-800' },
]

const TRANSACTION_TYPES: Record<string, { label: string; icon: any; color: string }> = {
  PURCHASE: { label: 'Compra', icon: ShoppingBag, color: 'text-blue-600' },
  CASHBACK: { label: 'Cashback', icon: PiggyBank, color: 'text-green-600' },
  BONUS: { label: 'Bônus', icon: Gift, color: 'text-purple-600' },
  MONTHLY_POINTS: { label: 'Pontos Mensais', icon: Star, color: 'text-yellow-600' },
  REFUND: { label: 'Reembolso', icon: Receipt, color: 'text-red-600' },
}

export default function EditarAssinantePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  // Estados
  const [assinante, setAssinante] = useState<AssinanteData | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [activeTab, setActiveTab] = useState('dados')

  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    birthDate: '',
    planId: '',
    cityId: '',
    subscriptionStatus: 'PENDING',
    points: 0,
    cashback: 0,
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    zipCode: '',
  })

  // Carregar dados
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [assinanteRes, plansRes, citiesRes] = await Promise.all([
        fetch(`/api/admin/assinantes/${id}`),
        fetch('/api/admin/plans'),
        fetch('/api/admin/cities')
      ])

      if (assinanteRes.ok) {
        const data = await assinanteRes.json()
        setAssinante(data)

        // Extrair endereço do JSON
        const addr = data.address || {}

        setFormData({
          name: data.name || data.user?.name || '',
          cpf: formatCPF(data.cpf || ''),
          phone: formatPhone(data.phone || ''),
          birthDate: data.birthDate ? data.birthDate.split('T')[0] : '',
          planId: data.plan?.id || '',
          cityId: data.city?.id || '',
          subscriptionStatus: data.subscriptionStatus || 'PENDING',
          points: data.points || 0,
          cashback: data.cashback || 0,
          address: addr.address || '',
          number: addr.number || '',
          complement: addr.complement || '',
          neighborhood: addr.neighborhood || '',
          zipCode: formatCEP(addr.zipCode || ''),
        })
      } else {
        toast.error('Assinante não encontrado')
        router.push('/admin/assinantes')
      }

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
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    if (id) fetchData()
  }, [id, fetchData])

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

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === 'cpf') {
      setFormData(prev => ({ ...prev, cpf: formatCPF(value) }))
    } else if (name === 'phone') {
      setFormData(prev => ({ ...prev, phone: formatPhone(value) }))
    } else if (name === 'zipCode') {
      setFormData(prev => ({ ...prev, zipCode: formatCEP(value) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value === 'none' ? '' : value }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/assinantes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar')
      }

      toast.success('Assinante atualizado com sucesso!')
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const copyQRCode = () => {
    if (assinante?.qrCode) {
      navigator.clipboard.writeText(assinante.qrCode)
      toast.success('QR Code copiado!')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = SUBSCRIPTION_STATUS.find(s => s.value === status)
    return (
      <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
        {statusConfig?.label || status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Carregando dados do assinante...</p>
        </div>
      </div>
    )
  }

  if (!assinante) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Assinante não encontrado</p>
        <Button asChild className="mt-4">
          <Link href="/admin/assinantes">Voltar</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/assinantes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Assinante</h1>
            <p className="text-muted-foreground">Gerencie os dados do assinante</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      {/* Layout Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Perfil e QR Code */}
        <div className="space-y-6">
          {/* Card Perfil */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-20" />
            <CardContent className="pt-0 -mt-10">
              <div className="flex flex-col items-center">
                {/* Avatar */}
                <div className="relative">
                  {assinante.user?.avatar ? (
                    <Image
                      src={assinante.user.avatar}
                      alt={assinante.name}
                      width={96}
                      height={96}
                      className="rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {assinante.name?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                  )}
                  {/* Status indicator */}
                  <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white ${assinante.subscriptionStatus === 'ACTIVE' ? 'bg-green-500' :
                      assinante.subscriptionStatus === 'PENDING' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                </div>

                {/* Nome e Email */}
                <h2 className="mt-4 text-xl font-bold text-center">{assinante.name}</h2>
                <p className="text-sm text-muted-foreground">{assinante.user?.email}</p>

                {/* Status Badge */}
                <div className="mt-2">
                  {getStatusBadge(assinante.subscriptionStatus)}
                </div>

                {/* Plano */}
                {assinante.plan && (
                  <div className="mt-3 px-4 py-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">{assinante.plan.name}</span>
                    </div>
                    {assinante.plan.price > 0 && (
                      <p className="text-xs text-blue-600 text-center mt-1">
                        {formatCurrency(assinante.plan.price)}/mês
                      </p>
                    )}
                  </div>
                )}

                {/* Data de cadastro */}
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Membro desde {new Date(assinante.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card QR Code */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-5 w-5 text-blue-600" />
                QR Code do Assinante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="flex flex-col items-center cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowQRModal(true)}
              >
                <div className="p-4 bg-white rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
                  <QRCodeSVG
                    value={assinante.qrCode}
                    size={140}
                    level="H"
                    includeMargin
                  />
                </div>
                <p className="mt-3 font-mono text-sm text-muted-foreground">
                  {assinante.qrCode}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); copyQRCode(); }}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowQRModal(true)}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ampliar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Estatísticas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium">Pontos</span>
                </div>
                <span className="text-lg font-bold text-yellow-700">{assinante.points}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Cashback</span>
                </div>
                <span className="text-lg font-bold text-green-700">{formatCurrency(assinante.cashback)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Compras</span>
                </div>
                <span className="text-lg font-bold text-blue-700">{assinante.stats?.totalTransactions || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium">Economia</span>
                </div>
                <span className="text-lg font-bold text-purple-700">{formatCurrency(assinante.stats?.totalSaved || 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Tabs */}
        <div className="lg:col-span-2">
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader className="pb-0">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="dados" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Dados Pessoais</span>
                    <span className="sm:hidden">Dados</span>
                  </TabsTrigger>
                  <TabsTrigger value="endereco" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="hidden sm:inline">Endereço</span>
                    <span className="sm:hidden">End.</span>
                  </TabsTrigger>
                  <TabsTrigger value="transacoes" className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    <span className="hidden sm:inline">Transações</span>
                    <span className="sm:hidden">Trans.</span>
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="pt-6">
                {/* Tab Dados Pessoais */}
                <TabsContent value="dados" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Nome do assinante"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={assinante.user?.email || ''}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-muted-foreground">Email não pode ser alterado</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleChange}
                        placeholder="000.000.000-00"
                        maxLength={14}
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
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Data de Nascimento</Label>
                      <Input
                        id="birthDate"
                        name="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cidade</Label>
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
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plano</Label>
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
                              {plan.name} {plan.price > 0 ? `- ${formatCurrency(plan.price)}` : '(Gratuito)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status da Assinatura</Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="points">Pontos</Label>
                      <Input
                        id="points"
                        name="points"
                        type="number"
                        value={formData.points}
                        onChange={handleChange}
                        min={0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cashback">Cashback (R$)</Label>
                      <Input
                        id="cashback"
                        name="cashback"
                        type="number"
                        step="0.01"
                        value={formData.cashback}
                        onChange={handleChange}
                        min={0}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab Endereço */}
                <TabsContent value="endereco" className="mt-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">CEP</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        placeholder="00000-000"
                        maxLength={9}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Rua, Avenida..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="number">Número</Label>
                      <Input
                        id="number"
                        name="number"
                        value={formData.number}
                        onChange={handleChange}
                        placeholder="Nº"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        name="complement"
                        value={formData.complement}
                        onChange={handleChange}
                        placeholder="Apto, Bloco..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input
                        id="neighborhood"
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={handleChange}
                        placeholder="Bairro"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab Transações */}
                <TabsContent value="transacoes" className="mt-0">
                  {(!assinante.transactions || assinante.transactions.length === 0) ? (
                    <div className="text-center py-12">
                      <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Nenhuma transação</h3>
                      <p className="text-muted-foreground">
                        As transações do assinante aparecerão aqui quando ele realizar compras pelo app.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Resumo */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <p className="text-2xl font-bold">{assinante.stats?.totalTransactions || 0}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-blue-700">
                            {formatCurrency(assinante.stats?.totalSpent || 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">Gasto</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-green-700">
                            {formatCurrency(assinante.stats?.totalSaved || 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">Economizado</p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-yellow-700">
                            {formatCurrency(assinante.stats?.totalCashback || 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">Cashback</p>
                        </div>
                      </div>

                      {/* Tabela */}
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Parceiro</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                              <TableHead className="text-right">Desconto</TableHead>
                              <TableHead>Data</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assinante.transactions.map((transaction) => {
                              const typeConfig = TRANSACTION_TYPES[transaction.type] || {
                                label: transaction.type,
                                icon: Receipt,
                                color: 'text-gray-600'
                              }
                              const TypeIcon = typeConfig.icon

                              return (
                                <TableRow key={transaction.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <TypeIcon className={`h-4 w-4 ${typeConfig.color}`} />
                                      <span className="text-sm">{typeConfig.label}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {transaction.parceiro ? (
                                      <div className="flex items-center gap-2">
                                        {transaction.parceiro.logo ? (
                                          <Image
                                            src={transaction.parceiro.logo}
                                            alt=""
                                            width={24}
                                            height={24}
                                            className="rounded"
                                          />
                                        ) : (
                                          <Building2 className="h-4 w-4 text-gray-400" />
                                        )}
                                        <span className="text-sm">
                                          {transaction.parceiro.tradeName || transaction.parceiro.companyName}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatCurrency(Number(transaction.amount))}
                                  </TableCell>
                                  <TableCell className="text-right text-green-600">
                                    {Number(transaction.discountApplied) > 0
                                      ? `-${formatCurrency(Number(transaction.discountApplied))}`
                                      : '-'}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {formatDate(transaction.createdAt)}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Modal QR Code */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">QR Code do Assinante</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="p-6 bg-white rounded-2xl border shadow-sm">
              <QRCodeSVG
                value={assinante.qrCode}
                size={250}
                level="H"
                includeMargin
              />
            </div>
            <div className="mt-4 text-center">
              <p className="font-mono text-lg font-bold">{assinante.qrCode}</p>
              <p className="text-sm text-muted-foreground mt-1">{assinante.name}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={copyQRCode}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Código
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Baixar QR Code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
