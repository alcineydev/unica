'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, 
  Save, 
  Phone, 
  Mail,
  MapPin,
  Globe,
  Image as ImageIcon,
  MessageCircle,
  Instagram,
  Facebook
} from 'lucide-react'
import { toast } from 'sonner'
import { useConfig } from '@/contexts/config-context'

interface GlobalConfig {
  // Identidade
  siteName: string
  siteDescription: string
  logo: string
  favicon: string
  
  // Contato
  email: string
  phone: string
  whatsapp: string
  address: string
  
  // Redes Sociais
  instagram: string
  facebook: string
  website: string
  
  // Textos
  footerText: string
  supportText: string
}

const defaultConfig: GlobalConfig = {
  siteName: 'UNICA - Clube de Benefícios',
  siteDescription: 'Seu clube de benefícios e descontos exclusivos',
  logo: '',
  favicon: '',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  instagram: '',
  facebook: '',
  website: '',
  footerText: '',
  supportText: ''
}

export default function ConfiguracoesAdminPage() {
  const [config, setConfig] = useState<GlobalConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { refetch: refetchGlobalConfig } = useConfig()

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/config')
      const data = await response.json()
      
      if (data.config) {
        setConfig({ ...defaultConfig, ...data.config })
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        toast.success('Configurações salvas com sucesso!')
        // Atualizar config global (logo no sidebar/header)
        await refetchGlobalConfig()
      } else {
        toast.error('Erro ao salvar configurações')
      }
    } catch (error) {
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Configurações Gerais</h1>
          <p className="text-sm text-muted-foreground">
            Configure as informações globais do sistema
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar
        </Button>
      </div>

      <Tabs defaultValue="identidade">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="identidade">Identidade</TabsTrigger>
          <TabsTrigger value="contato">Contato</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        {/* Identidade */}
        <TabsContent value="identidade" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Logo e Identidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Logo Principal</Label>
                  <ImageUpload
                    value={config.logo}
                    onChange={(url) => setConfig(prev => ({ ...prev, logo: url || '' }))}
                    folder="config"
                    aspectRatio="square"
                    className="w-32 h-32"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <ImageUpload
                    value={config.favicon}
                    onChange={(url) => setConfig(prev => ({ ...prev, favicon: url || '' }))}
                    folder="config"
                    aspectRatio="square"
                    className="w-20 h-20"
                  />
                  <p className="text-xs text-muted-foreground">Ícone que aparece na aba do navegador</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nome do Sistema</Label>
                  <Input
                    id="siteName"
                    value={config.siteName}
                    onChange={(e) => setConfig(prev => ({ ...prev, siteName: e.target.value }))}
                    placeholder="UNICA - Clube de Benefícios"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Descrição</Label>
                  <Textarea
                    id="siteDescription"
                    value={config.siteDescription}
                    onChange={(e) => setConfig(prev => ({ ...prev, siteDescription: e.target.value }))}
                    placeholder="Descrição do sistema..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contato */}
        <TabsContent value="contato" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={config.email}
                      onChange={(e) => setConfig(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="contato@unica.com"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={config.phone}
                      onChange={(e) => setConfig(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(00) 0000-0000"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp (para contato de parceiros)</Label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="whatsapp"
                    value={config.whatsapp}
                    onChange={(e) => setConfig(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="5566999999999 (apenas números com DDI)"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Este número será usado no botão &quot;Fazer Parceria&quot; da tela de login
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="address"
                    value={config.address}
                    onChange={(e) => setConfig(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Endereço completo..."
                    className="pl-10"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social */}
        <TabsContent value="social" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Redes Sociais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    value={config.website}
                    onChange={(e) => setConfig(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://www.unica.com"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="instagram"
                    value={config.instagram}
                    onChange={(e) => setConfig(prev => ({ ...prev, instagram: e.target.value }))}
                    placeholder="@unicaclube"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="facebook"
                    value={config.facebook}
                    onChange={(e) => setConfig(prev => ({ ...prev, facebook: e.target.value }))}
                    placeholder="facebook.com/unicaclube"
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botão Salvar Fixo */}
      <div className="sticky bottom-4 flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={isSaving} className="shadow-lg">
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
