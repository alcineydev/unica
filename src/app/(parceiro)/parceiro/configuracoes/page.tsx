'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { GalleryUpload } from '@/components/ui/gallery-upload'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  Save, 
  Building2, 
  MapPin, 
  Phone,
  Clock,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'

export default function ParceiroConfiguracoesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    // Dados básicos
    name: '',
    tradeName: '',
    cnpj: '',
    description: '',
    category: '',
    
    // Imagens
    logo: '',
    banner: '',
    gallery: [] as string[],
    
    // Contato
    whatsapp: '',
    phone: '',
    email: '',
    website: '',
    instagram: '',
    facebook: '',
    
    // Endereço
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Funcionamento
    openingHours: ''
  })

  useEffect(() => {
    fetchParceiro()
  }, [])

  const fetchParceiro = async () => {
    try {
      const response = await fetch('/api/parceiro/me')
      const data = await response.json()
      
      if (data.parceiro) {
        const p = data.parceiro
        setFormData({
          name: p.companyName || p.name || '',
          tradeName: p.tradeName || '',
          cnpj: p.cnpj || '',
          description: p.description || '',
          category: p.category || '',
          logo: p.logo || '',
          banner: p.banner || '',
          gallery: p.gallery || [],
          whatsapp: p.contact?.whatsapp || p.whatsapp || '',
          phone: p.contact?.phone || p.phone || '',
          email: p.user?.email || '',
          website: p.website || '',
          instagram: p.instagram || '',
          facebook: p.facebook || '',
          address: p.address?.street || '',
          number: p.address?.number || '',
          complement: p.address?.complement || '',
          neighborhood: p.address?.neighborhood || '',
          city: p.city?.name || '',
          state: p.city?.state || '',
          zipCode: p.address?.zipCode || '',
          openingHours: p.hours?.weekdays || p.openingHours || ''
        })
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/parceiro/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Dados atualizados com sucesso!')
      } else {
        toast.error('Erro ao atualizar dados')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao atualizar dados')
    } finally {
      setIsSaving(false)
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3')
    }
    return value
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5')
  }

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/^(\d{5})(\d{3}).*/, '$1-$2')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie os dados da sua empresa</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SEÇÃO: Imagens */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Imagens
            </CardTitle>
            <CardDescription>Logo, banner e galeria de fotos</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 space-y-6">
            
            {/* Logo */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Logo (formato quadrado)</Label>
              <ImageUpload
                value={formData.logo}
                onChange={(url) => setFormData(prev => ({ ...prev, logo: url || '' }))}
                folder="parceiros/logos"
                aspectRatio="square"
                className="w-32 h-32"
              />
            </div>

            <Separator />

            {/* Banner */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Banner (1200x300 recomendado)</Label>
              <ImageUpload
                value={formData.banner}
                onChange={(url) => setFormData(prev => ({ ...prev, banner: url || '' }))}
                folder="parceiros/banners"
                aspectRatio="wide"
                className="w-full h-32 md:h-40"
              />
            </div>

            <Separator />

            {/* Galeria */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Galeria de Fotos</Label>
              <GalleryUpload
                value={formData.gallery}
                onChange={(urls) => setFormData(prev => ({ ...prev, gallery: urls }))}
                folder="parceiros/gallery"
                maxImages={10}
              />
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO: Dados da Empresa */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Razão Social</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Razão social da empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradeName">Nome Fantasia</Label>
                <Input
                  id="tradeName"
                  value={formData.tradeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, tradeName: e.target.value }))}
                  placeholder="Nome fantasia"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnpj: formatCNPJ(e.target.value) }))}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Ex: Restaurante, Academia, Loja"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva sua empresa, produtos e serviços..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO: Contato */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: formatPhone(e.target.value) }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone Fixo</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                  placeholder="(00) 0000-0000"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contato@empresa.com"
                  disabled
                />
                <p className="text-xs text-muted-foreground">Email vinculado à conta</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://www.empresa.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                  placeholder="@suaempresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={formData.facebook}
                  onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                  placeholder="facebook.com/suaempresa"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO: Endereço */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Rua/Avenida</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Nome da rua ou avenida"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                  placeholder="Nº"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                  placeholder="Sala, loja, etc"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  placeholder="Nome do bairro"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  disabled
                  placeholder="Cidade"
                />
                <p className="text-xs text-muted-foreground">Alterado pelo administrador</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  disabled
                  placeholder="UF"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: formatCEP(e.target.value) }))}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO: Funcionamento */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horário de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-2">
              <Label htmlFor="openingHours">Horários</Label>
              <Textarea
                id="openingHours"
                value={formData.openingHours}
                onChange={(e) => setFormData(prev => ({ ...prev, openingHours: e.target.value }))}
                placeholder="Ex: Seg a Sex: 08h às 18h | Sáb: 08h às 12h | Dom: Fechado"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <Button type="submit" className="w-full" size="lg" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Todas as Alterações
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
