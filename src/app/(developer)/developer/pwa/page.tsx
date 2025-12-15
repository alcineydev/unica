'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/ui/image-upload'
import { 
  Smartphone, 
  Palette, 
  Image as ImageIcon, 
  Settings2, 
  Loader2, 
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface PWAConfig {
  id?: string
  appName: string
  shortName: string
  description: string
  themeColor: string
  backgroundColor: string
  icon72: string
  icon96: string
  icon128: string
  icon144: string
  icon152: string
  icon192: string
  icon384: string
  icon512: string
  splashIphone5: string
  splashIphone6: string
  splashIphonePlus: string
  splashIphoneX: string
  splashIphoneXr: string
  splashIphoneXsMax: string
  splashIpad: string
  splashIpadPro: string
  display: string
  orientation: string
  startUrl: string
  scope: string
  screenshot1: string
  screenshot2: string
  screenshot3: string
  isActive: boolean
}

const defaultConfig: PWAConfig = {
  appName: 'UNICA - Clube de Benefícios',
  shortName: 'UNICA',
  description: 'Seu clube de benefícios e descontos exclusivos',
  themeColor: '#000000',
  backgroundColor: '#ffffff',
  icon72: '',
  icon96: '',
  icon128: '',
  icon144: '',
  icon152: '',
  icon192: '',
  icon384: '',
  icon512: '',
  splashIphone5: '',
  splashIphone6: '',
  splashIphonePlus: '',
  splashIphoneX: '',
  splashIphoneXr: '',
  splashIphoneXsMax: '',
  splashIpad: '',
  splashIpadPro: '',
  display: 'standalone',
  orientation: 'portrait-primary',
  startUrl: '/',
  scope: '/',
  screenshot1: '',
  screenshot2: '',
  screenshot3: '',
  isActive: true
}

export default function PWAConfigPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [config, setConfig] = useState<PWAConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('geral')

  useEffect(() => {
    if (session?.user?.role !== 'DEVELOPER') {
      router.push('/developer')
      return
    }
    fetchConfig()
  }, [session, router])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/developer/pwa')
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
      const response = await fetch('/api/developer/pwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        toast.success('Configurações salvas com sucesso!')
      } else {
        toast.error('Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateManifest = async () => {
    try {
      window.open('/api/manifest', '_blank')
      toast.success('Manifest aberto em nova aba!')
    } catch (error) {
      toast.error('Erro ao abrir manifest')
    }
  }

  const iconSizes = [
    { key: 'icon72', size: '72x72', label: '72px' },
    { key: 'icon96', size: '96x96', label: '96px' },
    { key: 'icon128', size: '128x128', label: '128px' },
    { key: 'icon144', size: '144x144', label: '144px' },
    { key: 'icon152', size: '152x152', label: '152px' },
    { key: 'icon192', size: '192x192', label: '192px' },
    { key: 'icon384', size: '384x384', label: '384px' },
    { key: 'icon512', size: '512x512', label: '512px (Obrigatório)' },
  ]

  const splashScreens = [
    { key: 'splashIphone5', size: '640x1136', label: 'iPhone 5/SE' },
    { key: 'splashIphone6', size: '750x1334', label: 'iPhone 6/7/8' },
    { key: 'splashIphonePlus', size: '1242x2208', label: 'iPhone Plus' },
    { key: 'splashIphoneX', size: '1125x2436', label: 'iPhone X/XS' },
    { key: 'splashIphoneXr', size: '828x1792', label: 'iPhone XR/11' },
    { key: 'splashIphoneXsMax', size: '1242x2688', label: 'iPhone XS Max/11 Pro Max' },
    { key: 'splashIpad', size: '1536x2048', label: 'iPad' },
    { key: 'splashIpadPro', size: '2048x2732', label: 'iPad Pro' },
  ]

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
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold">PWA / App Mobile</h1>
            <Badge variant={config.isActive ? 'default' : 'secondary'}>
              {config.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure o Progressive Web App para instalação em dispositivos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateManifest}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Ver Manifest
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      {/* Status do PWA */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              {config.icon512 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="text-sm">Ícone 512px</span>
            </div>
            <div className="flex items-center gap-2">
              {config.icon192 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="text-sm">Ícone 192px</span>
            </div>
            <div className="flex items-center gap-2">
              {config.appName ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm">Nome do App</span>
            </div>
            <div className="flex items-center gap-2">
              {config.themeColor ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="text-sm">Cores</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="geral" className="flex items-center gap-1">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="cores" className="flex items-center gap-1">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Cores</span>
          </TabsTrigger>
          <TabsTrigger value="icones" className="flex items-center gap-1">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Ícones</span>
          </TabsTrigger>
          <TabsTrigger value="splash" className="flex items-center gap-1">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Splash</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Geral */}
        <TabsContent value="geral" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações do App</CardTitle>
              <CardDescription>Nome e descrição que aparecerão no dispositivo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="appName">Nome Completo do App</Label>
                  <Input
                    id="appName"
                    value={config.appName}
                    onChange={(e) => setConfig(prev => ({ ...prev, appName: e.target.value }))}
                    placeholder="UNICA - Clube de Benefícios"
                  />
                  <p className="text-xs text-muted-foreground">Exibido na tela de instalação</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortName">Nome Curto</Label>
                  <Input
                    id="shortName"
                    value={config.shortName}
                    onChange={(e) => setConfig(prev => ({ ...prev, shortName: e.target.value }))}
                    placeholder="UNICA"
                    maxLength={12}
                  />
                  <p className="text-xs text-muted-foreground">Exibido abaixo do ícone (máx 12 chars)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={config.description}
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do app..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurações de Exibição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Modo de Exibição</Label>
                  <Select 
                    value={config.display} 
                    onValueChange={(value) => setConfig(prev => ({ ...prev, display: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standalone">Standalone (Recomendado)</SelectItem>
                      <SelectItem value="fullscreen">Fullscreen</SelectItem>
                      <SelectItem value="minimal-ui">Minimal UI</SelectItem>
                      <SelectItem value="browser">Browser</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Orientação</Label>
                  <Select 
                    value={config.orientation} 
                    onValueChange={(value) => setConfig(prev => ({ ...prev, orientation: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait-primary">Retrato</SelectItem>
                      <SelectItem value="landscape-primary">Paisagem</SelectItem>
                      <SelectItem value="any">Qualquer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startUrl">URL Inicial</Label>
                  <Input
                    id="startUrl"
                    value={config.startUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, startUrl: e.target.value }))}
                    placeholder="/"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scope">Escopo</Label>
                  <Input
                    id="scope"
                    value={config.scope}
                    onChange={(e) => setConfig(prev => ({ ...prev, scope: e.target.value }))}
                    placeholder="/"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Cores */}
        <TabsContent value="cores" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cores do App</CardTitle>
              <CardDescription>Defina as cores principais do PWA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>Cor do Tema (Theme Color)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.themeColor}
                      onChange={(e) => setConfig(prev => ({ ...prev, themeColor: e.target.value }))}
                      className="w-16 h-16 rounded-lg cursor-pointer border-2"
                    />
                    <div>
                      <Input
                        value={config.themeColor}
                        onChange={(e) => setConfig(prev => ({ ...prev, themeColor: e.target.value }))}
                        placeholder="#000000"
                        className="w-28"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Barra de status e navegação</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Cor de Fundo (Background)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.backgroundColor}
                      onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-16 h-16 rounded-lg cursor-pointer border-2"
                    />
                    <div>
                      <Input
                        value={config.backgroundColor}
                        onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        placeholder="#ffffff"
                        className="w-28"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Splash screen e fundo</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <Separator />
              <div>
                <Label className="mb-3 block">Preview</Label>
                <div className="flex gap-4">
                  <div 
                    className="w-20 h-36 rounded-xl border-4 border-gray-800 overflow-hidden"
                    style={{ backgroundColor: config.backgroundColor }}
                  >
                    <div 
                      className="h-4"
                      style={{ backgroundColor: config.themeColor }}
                    />
                    <div className="flex items-center justify-center h-full">
                      {config.icon192 ? (
                        <img src={config.icon192} alt="Icon" className="w-12 h-12 rounded-xl" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gray-300" />
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Preview de como o app aparecerá</p>
                    <p>ao ser aberto no dispositivo.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Ícones */}
        <TabsContent value="icones" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ícones do App</CardTitle>
              <CardDescription>
                Upload dos ícones em diferentes tamanhos. Mínimo: 192px e 512px
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {iconSizes.map(({ key, size, label }) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-xs">{label}</Label>
                    <ImageUpload
                      value={config[key as keyof PWAConfig] as string}
                      onChange={(url) => setConfig(prev => ({ ...prev, [key]: url || '' }))}
                      folder="pwa/icons"
                      aspectRatio="square"
                      className="w-full aspect-square max-w-24"
                    />
                    <p className="text-[10px] text-muted-foreground text-center">{size}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              {/* Screenshots */}
              <div>
                <Label className="mb-3 block">Screenshots (opcional)</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Imagens exibidas na tela de instalação em alguns dispositivos
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  {['screenshot1', 'screenshot2', 'screenshot3'].map((key, index) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-xs">Screenshot {index + 1}</Label>
                      <ImageUpload
                        value={config[key as keyof PWAConfig] as string}
                        onChange={(url) => setConfig(prev => ({ ...prev, [key]: url || '' }))}
                        folder="pwa/screenshots"
                        className="w-full aspect-[9/16]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Splash Screens */}
        <TabsContent value="splash" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Splash Screens</CardTitle>
              <CardDescription>
                Telas de abertura para dispositivos iOS. Android usa ícone + cor de fundo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {splashScreens.map(({ key, size, label }) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-xs">{label}</Label>
                    <ImageUpload
                      value={config[key as keyof PWAConfig] as string}
                      onChange={(url) => setConfig(prev => ({ ...prev, [key]: url || '' }))}
                      folder="pwa/splash"
                      className="w-full aspect-[9/16]"
                    />
                    <p className="text-[10px] text-muted-foreground text-center">{size}</p>
                  </div>
                ))}
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

