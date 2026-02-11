'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Loader2,
  Save,
  Building2,
  MapPin,
  Phone,
  ImageIcon,
  Settings,
  Gift,
  BarChart3,
  MessageSquare,
  Plus,
  ExternalLink,
  Calendar,
  Users,
  FolderOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Componentes criados
import { PartnerStatsCards } from '@/components/admin/partner-stats-cards'
import { PartnerBenefitsSelector } from '@/components/admin/partner-benefits-selector'
import { PartnerTimelineChart } from '@/components/admin/partner-timeline-chart'
import { PartnerRecentTransactions } from '@/components/admin/partner-recent-transactions'
import { PartnerRecentReviews } from '@/components/admin/partner-recent-reviews'
import { CreateCategoryModal } from '@/components/admin/create-category-modal'
import { CreateCityModal } from '@/components/admin/create-city-modal'
import { ImageUpload } from '@/components/ui/image-upload'
import { GalleryUpload } from '@/components/ui/gallery-upload'

// Types
interface Category {
  id: string
  name: string
  slug: string
}

interface City {
  id: string
  name: string
  state: string
}

interface Benefit {
  id: string
  name: string
  description?: string
  type?: string
  category?: string
}

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  description: string
  createdAt: string
  assinante?: { id: string; name: string }
}

interface Review {
  id: string
  nota: number
  comentario?: string
  resposta?: string
  publicada: boolean
  createdAt: string
  assinante?: { id: string; name: string }
}

interface TimelineData {
  month: string
  label: string
  count: number
  amount: number
}

interface PartnerData {
  id: string
  companyName: string
  tradeName?: string
  cnpj: string
  description?: string
  logo?: string
  banner?: string
  gallery: string[]
  categoryId?: string
  cityId: string
  address: {
    street?: string
    number?: string
    neighborhood?: string
    complement?: string
    zipCode?: string
  }
  contact: {
    whatsapp?: string
    phone?: string
    website?: string
    instagram?: string
    facebook?: string
  }
  isActive: boolean
  isDestaque: boolean
  bannerDestaque?: string
  destaqueOrder: number
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    email: string
    isActive: boolean
  }
  city?: City
  categoryRef?: Category
  benefitAccess: Array<{ id: string; benefitId: string; benefit: Benefit }>
  allBenefits: Benefit[]
  allCategories: Category[]
  allCities: City[]
  stats: {
    totalTransacoes: number
    transacoesCompleted: number
    transacoesEsteMes: number
    receitaTotal: number
    receitaEsteMes: number
    mediaAvaliacao: number
    totalAvaliacoes: number
    avaliacoesPublicadas: number
    timeline: TimelineData[]
  }
  recentTransactions: Transaction[]
  recentAvaliacoes: Review[]
  _count: {
    transactions: number
    benefitAccess: number
    avaliacoes: number
  }
}

export default function EditarParceiroPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  // Estados principais
  const [partner, setPartner] = useState<PartnerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('informacoes')

  // Estados do formulário
  const [formData, setFormData] = useState({
    companyName: '',
    tradeName: '',
    description: '',
    categoryId: '',
    cityId: '',
    // Endereço
    zipCode: '',
    address: '',
    addressNumber: '',
    neighborhood: '',
    complement: '',
    // Contato
    whatsapp: '',
    phone: '',
    website: '',
    instagram: '',
    facebook: '',
    // Destaque
    destaqueOrder: 1,
  })

  // Estados de imagens
  const [logo, setLogo] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [gallery, setGallery] = useState<string[]>([])
  const [bannerDestaque, setBannerDestaque] = useState<string | null>(null)

  // Estados de controle
  const [isActive, setIsActive] = useState(true)
  const [isDestaque, setIsDestaque] = useState(false)
  const [selectedBenefitIds, setSelectedBenefitIds] = useState<string[]>([])

  // Estados das listas (para atualização após criar)
  const [categories, setCategories] = useState<Category[]>([])
  const [cities, setCities] = useState<City[]>([])

  // Estados dos modais
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showCityModal, setShowCityModal] = useState(false)

  // Carregar parceiro
  const fetchPartner = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/partners/${id}`)

      if (response.ok) {
        const data: PartnerData = await response.json()
        setPartner(data)

        // Popular formulário
        setFormData({
          companyName: data.companyName || '',
          tradeName: data.tradeName || '',
          description: data.description || '',
          categoryId: data.categoryId || '',
          cityId: data.cityId || '',
          zipCode: data.address?.zipCode || '',
          address: data.address?.street || '',
          addressNumber: data.address?.number || '',
          neighborhood: data.address?.neighborhood || '',
          complement: data.address?.complement || '',
          whatsapp: data.contact?.whatsapp || '',
          phone: data.contact?.phone || '',
          website: data.contact?.website || '',
          instagram: data.contact?.instagram || '',
          facebook: data.contact?.facebook || '',
          destaqueOrder: data.destaqueOrder || 1,
        })

        // Imagens
        setLogo(data.logo || null)
        setBanner(data.banner || null)
        setGallery(data.gallery || [])
        setBannerDestaque(data.bannerDestaque || null)

        // Controles
        setIsActive(data.isActive ?? true)
        setIsDestaque(data.isDestaque ?? false)

        // Benefícios selecionados
        const benefitIds = data.benefitAccess?.map(ba => ba.benefitId) || []
        setSelectedBenefitIds(benefitIds)

        // Listas
        setCategories(data.allCategories || [])
        setCities(data.allCities || [])
      } else {
        toast.error('Parceiro não encontrado')
        router.push('/admin/parceiros')
      }
    } catch (error) {
      console.error('Erro ao carregar parceiro:', error)
      toast.error('Erro ao carregar parceiro')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    if (id) fetchPartner()
  }, [id, fetchPartner])

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Salvar
  const handleSave = async () => {
    if (!formData.companyName.trim()) {
      toast.error('Razão Social é obrigatória')
      return
    }

    if (!formData.whatsapp.trim()) {
      toast.error('WhatsApp é obrigatório')
      return
    }

    if (!formData.cityId) {
      toast.error('Cidade é obrigatória')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName.trim(),
          tradeName: formData.tradeName.trim() || null,
          description: formData.description.trim() || null,
          categoryId: formData.categoryId || null,
          cityId: formData.cityId,
          logo,
          banner,
          gallery,
          address: formData.address,
          addressNumber: formData.addressNumber,
          neighborhood: formData.neighborhood,
          complement: formData.complement,
          zipCode: formData.zipCode,
          whatsapp: formData.whatsapp,
          phone: formData.phone,
          website: formData.website,
          instagram: formData.instagram,
          facebook: formData.facebook,
          isActive,
          isDestaque,
          bannerDestaque,
          destaqueOrder: formData.destaqueOrder,
          benefitIds: selectedBenefitIds,
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar')
      }

      toast.success('Parceiro atualizado com sucesso!')
      fetchPartner() // Recarregar dados
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  // Callbacks dos modais
  const handleCategoryCreated = (newCategory: Category) => {
    setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)))
    setFormData(prev => ({ ...prev, categoryId: newCategory.id }))
  }

  const handleCityCreated = (newCity: City) => {
    setCities(prev => [...prev, newCity].sort((a, b) => a.name.localeCompare(b.name)))
    setFormData(prev => ({ ...prev, cityId: newCity.id }))
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  // Not found
  if (!partner) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Parceiro não encontrado</p>
        <Button asChild>
          <Link href="/admin/parceiros">Voltar para Parceiros</Link>
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
            <Link href="/admin/parceiros">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>

          {/* Logo + Info */}
          <div className="flex items-center gap-4">
            {logo ? (
              <Image
                src={logo}
                alt={partner.companyName}
                width={56}
                height={56}
                className="rounded-xl object-cover border"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
                <Building2 className="h-7 w-7 text-green-600" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">
                  {partner.tradeName || partner.companyName}
                </h1>
                <Badge
                  variant={isActive ? 'default' : 'secondary'}
                  className={isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                >
                  {isActive ? 'Ativo' : 'Inativo'}
                </Badge>
                {isDestaque && (
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                    ⭐ Destaque
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {partner.categoryRef?.name || 'Sem categoria'} • {partner.city?.name}, {partner.city?.state}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/parceiro/${partner.id}`} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Página
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
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
      <PartnerStatsCards
        totalTransacoes={partner.stats.totalTransacoes}
        transacoesEsteMes={partner.stats.transacoesEsteMes}
        receitaTotal={partner.stats.receitaTotal}
        receitaEsteMes={partner.stats.receitaEsteMes}
        mediaAvaliacao={partner.stats.mediaAvaliacao}
        totalAvaliacoes={partner.stats.totalAvaliacoes}
      />

      {/* Conteúdo Principal com Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal (2/3) */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="informacoes" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Informações</span>
              </TabsTrigger>
              <TabsTrigger value="beneficios" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                <span className="hidden sm:inline">Benefícios</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="avaliacoes" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Avaliações</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Informações */}
            <TabsContent value="informacoes" className="space-y-6">
              {/* Imagens */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Imagens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Banner (1200x300 recomendado)</Label>
                    <ImageUpload
                      value={banner}
                      onChange={setBanner}
                      aspectRatio="banner"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Logo (quadrado)</Label>
                      <ImageUpload
                        value={logo}
                        onChange={setLogo}
                        aspectRatio="square"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Galeria (até 10 fotos)</Label>
                      <GalleryUpload
                        value={gallery}
                        onChange={setGallery}
                        maxImages={10}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dados da Empresa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Dados da Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Razão Social *</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tradeName">Nome Fantasia</Label>
                      <Input
                        id="tradeName"
                        name="tradeName"
                        value={formData.tradeName}
                        onChange={handleChange}
                        className="h-11"
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
                      placeholder="Descreva o parceiro..."
                      rows={3}
                    />
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Email de acesso:</strong> {partner.user?.email || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      O email não pode ser alterado após o cadastro
                    </p>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp *</Label>
                      <Input
                        id="whatsapp"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(00) 0000-0000"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://www.exemplo.com"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        placeholder="@exemplo"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      name="facebook"
                      value={formData.facebook}
                      onChange={handleChange}
                      placeholder="facebook.com/exemplo"
                      className="h-11"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Endereço */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">CEP</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        placeholder="00000-000"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Rua, Avenida..."
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addressNumber">Número</Label>
                      <Input
                        id="addressNumber"
                        name="addressNumber"
                        value={formData.addressNumber}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input
                        id="neighborhood"
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        name="complement"
                        value={formData.complement}
                        onChange={handleChange}
                        placeholder="Sala, Bloco..."
                        className="h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Benefícios */}
            <TabsContent value="beneficios">
              <PartnerBenefitsSelector
                allBenefits={partner.allBenefits || []}
                selectedBenefitIds={selectedBenefitIds}
                onChange={setSelectedBenefitIds}
              />
            </TabsContent>

            {/* Tab: Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PartnerTimelineChart
                  data={partner.stats.timeline || []}
                  type="count"
                />
                <PartnerTimelineChart
                  data={partner.stats.timeline || []}
                  type="amount"
                />
              </div>
              <PartnerRecentTransactions
                transactions={partner.recentTransactions || []}
              />
            </TabsContent>

            {/* Tab: Avaliações */}
            <TabsContent value="avaliacoes">
              <PartnerRecentReviews
                reviews={partner.recentAvaliacoes || []}
              />
            </TabsContent>
          </Tabs>
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
              {/* Switch: Parceiro Ativo */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Parceiro Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Visível para assinantes
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive(!isActive)}
                  className={`
                    relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 
                    focus-visible:ring-green-500 focus-visible:ring-offset-2
                    ${isActive ? 'bg-green-600' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg 
                      ring-0 transition duration-200 ease-in-out
                      ${isActive ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>

              {/* Switch: Destaque na Home */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Destaque na Home</Label>
                  <p className="text-sm text-muted-foreground">
                    Aparecer no carrossel principal
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDestaque}
                  onClick={() => setIsDestaque(!isDestaque)}
                  className={`
                    relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 
                    focus-visible:ring-yellow-500 focus-visible:ring-offset-2
                    ${isDestaque ? 'bg-yellow-500' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg 
                      ring-0 transition duration-200 ease-in-out
                      ${isDestaque ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>

              {/* Opções de Destaque */}
              {isDestaque && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Banner do Destaque (1200x600)</Label>
                    <ImageUpload
                      value={bannerDestaque}
                      onChange={setBannerDestaque}
                      aspectRatio="banner"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destaqueOrder">Ordem no Carrossel</Label>
                    <Input
                      id="destaqueOrder"
                      name="destaqueOrder"
                      type="number"
                      min="1"
                      value={formData.destaqueOrder}
                      onChange={handleChange}
                      className="h-11"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categoria e Cidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Classificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => handleSelectChange('categoryId', value)}
                  >
                    <SelectTrigger className="flex-1 h-11">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCategoryModal(true)}
                    className="h-11 w-11 flex-shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Cidade */}
              <div className="space-y-2">
                <Label>Cidade *</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.cityId}
                    onValueChange={(value) => handleSelectChange('cityId', value)}
                  >
                    <SelectTrigger className="flex-1 h-11">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name} - {city.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCityModal(true)}
                    className="h-11 w-11 flex-shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline (se tiver dados) */}
          {partner.stats.timeline && partner.stats.timeline.length > 0 && (
            <PartnerTimelineChart
              data={partner.stats.timeline}
              type="count"
            />
          )}

          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Benefícios
                </span>
                <span className="font-medium">{selectedBenefitIds.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Transações
                </span>
                <span className="font-medium">{partner._count.transactions}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Avaliações
                </span>
                <span className="font-medium">{partner._count.avaliacoes}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Desde
                </span>
                <span className="font-medium">
                  {format(new Date(partner.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Botão Salvar (mobile) */}
          <Button
            className="w-full lg:hidden bg-green-600 hover:bg-green-700"
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

      {/* Modais */}
      <CreateCategoryModal
        open={showCategoryModal}
        onOpenChange={setShowCategoryModal}
        onSuccess={handleCategoryCreated}
      />
      <CreateCityModal
        open={showCityModal}
        onOpenChange={setShowCityModal}
        onSuccess={handleCityCreated}
      />
    </div>
  )
}
