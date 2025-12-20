'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Building2,
  Gift,
  Settings,
  Save,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Bell,
  Upload,
  Camera,
  Percent
} from 'lucide-react'
import { toast } from 'sonner'

interface ParceiroData {
  id: string
  companyName: string
  tradeName: string
  cnpj: string
  category: string
  description: string
  logo: string
  banner: string
  city: {
    name: string
    state: string
  }
  contact: {
    whatsapp: string
    phone: string
    email: string
  }
  hours: {
    weekdays: string
    saturday: string
    sunday: string
  }
  address: {
    street: string
    number: string
    neighborhood: string
    cep: string
  }
  user: {
    email: string
  }
}

interface Beneficio {
  id: string
  name: string
  description: string
  type: string
  value: number
}

export default function PerfilEmpresaPage() {
  const [parceiro, setParceiro] = useState<ParceiroData | null>(null)
  const [beneficios, setBeneficios] = useState<Beneficio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('dados')
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true)

  // Form states
  const [formData, setFormData] = useState({
    tradeName: '',
    description: '',
    whatsapp: '',
    phone: '',
    weekdays: '',
    saturday: '',
    sunday: '',
  })

  useEffect(() => {
    fetchPerfil()
  }, [])

  const fetchPerfil = async () => {
    try {
      const response = await fetch('/api/parceiro/perfil')
      const result = await response.json()

      if (response.ok && result.data) {
        setParceiro(result.data)
        setFormData({
          tradeName: result.data.tradeName || '',
          description: result.data.description || '',
          whatsapp: result.data.contact?.whatsapp || '',
          phone: result.data.contact?.phone || '',
          weekdays: result.data.hours?.weekdays || '',
          saturday: result.data.hours?.saturday || '',
          sunday: result.data.hours?.sunday || '',
        })
        setBeneficios(result.beneficios || [])
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/parceiro/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erro ao salvar')
        return
      }

      toast.success('Dados salvos com sucesso!')
      fetchPerfil()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar dados')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatCNPJ = (cnpj: string): string => {
    if (!cnpj) return '-'
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15)
  }

  const getBenefitTypeBadge = (type: string) => {
    switch (type) {
      case 'DISCOUNT':
        return <Badge className="bg-blue-500">Desconto</Badge>
      case 'CASHBACK':
        return <Badge className="bg-green-500">Cashback</Badge>
      case 'POINTS':
        return <Badge className="bg-yellow-500">Pontos</Badge>
      case 'FREE':
        return <Badge className="bg-purple-500">Grátis</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Perfil da Empresa</h1>
          <p className="text-muted-foreground">Gerencie as informações do seu estabelecimento</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dados" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Dados</span>
          </TabsTrigger>
          <TabsTrigger value="beneficios" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">Benefícios</span>
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configurações</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Dados da Empresa */}
        <TabsContent value="dados" className="space-y-6 mt-6">
          {/* Logo e Banner */}
          <Card>
            <CardHeader>
              <CardTitle>Imagens</CardTitle>
              <CardDescription>Logo e banner do estabelecimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Logo */}
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={parceiro?.logo} />
                    <AvatarFallback className="text-2xl bg-primary/10">
                      {formData.tradeName?.charAt(0) || parceiro?.companyName?.charAt(0) || 'E'}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Alterar Logo
                  </Button>
                </div>

                {/* Banner */}
                <div className="flex-1">
                  <div className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden">
                    {parceiro?.banner ? (
                      <img src={parceiro.banner} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Upload className="h-8 w-8 mx-auto mb-1" />
                        <span className="text-xs">Banner (1200x300)</span>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Upload className="h-4 w-4 mr-2" />
                    Alterar Banner
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Fixas (somente leitura) */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Cadastrais</CardTitle>
              <CardDescription>Dados fixos da empresa (somente leitura)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Razão Social</Label>
                  <p className="font-medium">{parceiro?.companyName || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">CNPJ</Label>
                  <p className="font-medium">{formatCNPJ(parceiro?.cnpj || '')}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Categoria</Label>
                  <Badge variant="outline">{parceiro?.category || '-'}</Badge>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Cidade</Label>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{parceiro?.city?.name} - {parceiro?.city?.state}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground">Email de Acesso</Label>
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{parceiro?.user?.email || '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Editáveis */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Editáveis</CardTitle>
              <CardDescription>Atualize os dados do seu estabelecimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Fantasia</Label>
                <Input
                  value={formData.tradeName}
                  onChange={(e) => handleInputChange('tradeName', e.target.value)}
                  placeholder="Nome do estabelecimento"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva seu estabelecimento..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange('whatsapp', formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Benefícios */}
        <TabsContent value="beneficios" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Benefícios que Você Oferece</CardTitle>
              <CardDescription>
                Lista de benefícios disponíveis para os assinantes do clube
              </CardDescription>
            </CardHeader>
            <CardContent>
              {beneficios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum benefício cadastrado</p>
                  <p className="text-sm">Entre em contato com o administrador para adicionar benefícios</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {beneficios.map((beneficio) => (
                    <div
                      key={beneficio.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          {beneficio.type === 'DISCOUNT' ? (
                            <Percent className="h-5 w-5 text-primary" />
                          ) : (
                            <Gift className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{beneficio.name}</p>
                          {beneficio.description && (
                            <p className="text-sm text-muted-foreground">{beneficio.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {beneficio.value > 0 && (
                          <span className="font-semibold text-primary">
                            {beneficio.type === 'DISCOUNT' || beneficio.type === 'CASHBACK'
                              ? `${beneficio.value}%`
                              : beneficio.value}
                          </span>
                        )}
                        {getBenefitTypeBadge(beneficio.type)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configurações */}
        <TabsContent value="configuracoes" className="space-y-6 mt-6">
          {/* Horário de Funcionamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horário de Funcionamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Segunda a Sexta</Label>
                  <Input
                    value={formData.weekdays}
                    onChange={(e) => handleInputChange('weekdays', e.target.value)}
                    placeholder="08:00 - 18:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sábado</Label>
                  <Input
                    value={formData.saturday}
                    onChange={(e) => handleInputChange('saturday', e.target.value)}
                    placeholder="08:00 - 12:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Domingo</Label>
                  <Input
                    value={formData.sunday}
                    onChange={(e) => handleInputChange('sunday', e.target.value)}
                    placeholder="Fechado"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Receber notificações</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas sobre novas vendas e avaliações
                  </p>
                </div>
                <Switch
                  checked={notificacoesAtivas}
                  onCheckedChange={setNotificacoesAtivas}
                />
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Business */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                WhatsApp Business
              </CardTitle>
              <CardDescription>
                Configure o número para receber contatos dos clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Número do WhatsApp</Label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground">
                  Este número será usado para clientes entrarem em contato
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
