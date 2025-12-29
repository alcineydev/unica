'use client'

import { useEffect, useState } from 'react'
import {
  Palette,
  Image as ImageIcon,
  Settings,
  Save,
  Loader2,
  Upload,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import Image from 'next/image'

interface SystemConfig {
  id: string
  key: string
  value: string | null
  type: string
  category: string
  description: string | null
}

export default function SistemaPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({
    // Geral
    app_name: 'UNICA',
    app_description: 'Clube de Benefícios',
    // Branding
    logo_light: '',
    logo_dark: '',
    logo_icon: '',
    favicon: '',
    // Theme
    color_primary: '#1E3A8A',
    color_primary_light: '#3B82F6',
    color_secondary: '#10B981',
    color_accent: '#F59E0B',
    color_background_dark: '#0F172A',
    color_background_light: '#F8FAFC',
    color_text_dark: '#111827',
    color_text_light: '#F8FAFC'
  })

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/developer/config')
      if (res.ok) {
        const data = await res.json()

        // Preencher formData com valores do banco
        const newFormData = { ...formData }
        if (data.configs) {
          data.configs.forEach((config: SystemConfig) => {
            if (config.value) {
              newFormData[config.key] = config.value
            }
          })
        }
        setFormData(newFormData)
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleImageUpload = async (key: string, file: File) => {
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('folder', 'system')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })

      if (!res.ok) throw new Error('Erro no upload')

      const data = await res.json()
      handleChange(key, data.url)
      toast.success('Imagem enviada!')
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao enviar imagem')
    }
  }

  const handleSave = async (category: string) => {
    setSaving(true)
    try {
      // Mapear chaves por categoria
      const categoryKeys: Record<string, string[]> = {
        general: ['app_name', 'app_description'],
        branding: ['logo_light', 'logo_dark', 'logo_icon', 'favicon'],
        theme: [
          'color_primary', 'color_primary_light', 'color_secondary', 'color_accent',
          'color_background_dark', 'color_background_light', 'color_text_dark', 'color_text_light'
        ]
      }

      const keys = categoryKeys[category] || []
      const configsToSave = keys.map(key => ({
        key,
        value: formData[key] || ''
      }))

      const res = await fetch('/api/developer/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: configsToSave })
      })

      if (!res.ok) throw new Error('Erro ao salvar')

      toast.success('Configurações salvas!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações do Sistema</h1>
        <p className="text-zinc-400">
          Gerencie a identidade visual e configurações globais
        </p>
      </div>

      <Tabs defaultValue="branding" className="space-y-4">
        <TabsList className="bg-zinc-800 border-zinc-700">
          <TabsTrigger value="branding" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <ImageIcon className="h-4 w-4 mr-2" />
            Identidade Visual
          </TabsTrigger>
          <TabsTrigger value="theme" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <Palette className="h-4 w-4 mr-2" />
            Cores do Tema
          </TabsTrigger>
          <TabsTrigger value="general" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <Settings className="h-4 w-4 mr-2" />
            Geral
          </TabsTrigger>
        </TabsList>

        {/* Tab: Identidade Visual */}
        <TabsContent value="branding" className="space-y-4">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Logotipos</CardTitle>
              <CardDescription className="text-zinc-400">
                Faça upload das logos do sistema para modo claro e escuro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo para fundo claro */}
              <div className="space-y-2">
                <Label className="text-zinc-300">Logo para Fundo Escuro (200x60px)</Label>
                <p className="text-xs text-zinc-500">
                  Usada quando o tema escuro está ativo
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-[200px] h-[60px] border border-zinc-700 rounded-lg bg-zinc-900 flex items-center justify-center overflow-hidden">
                    {formData.logo_light ? (
                      <Image
                        src={formData.logo_light}
                        alt="Logo Light"
                        width={200}
                        height={60}
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <span className="text-zinc-600 text-sm">Sem logo</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload('logo_light', file)
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" className="border-zinc-700 text-zinc-300" asChild>
                        <span><Upload className="h-4 w-4 mr-2" />Upload</span>
                      </Button>
                    </label>
                    {formData.logo_light && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleChange('logo_light', '')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Logo para fundo escuro */}
              <div className="space-y-2">
                <Label className="text-zinc-300">Logo para Fundo Claro (200x60px)</Label>
                <p className="text-xs text-zinc-500">
                  Usada quando o tema claro está ativo
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-[200px] h-[60px] border border-zinc-700 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                    {formData.logo_dark ? (
                      <Image
                        src={formData.logo_dark}
                        alt="Logo Dark"
                        width={200}
                        height={60}
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <span className="text-zinc-400 text-sm">Sem logo</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload('logo_dark', file)
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" className="border-zinc-700 text-zinc-300" asChild>
                        <span><Upload className="h-4 w-4 mr-2" />Upload</span>
                      </Button>
                    </label>
                    {formData.logo_dark && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleChange('logo_dark', '')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Ícone e Favicon */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Ícone do Logo (40x40px)</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-[40px] h-[40px] border border-zinc-700 rounded-lg bg-zinc-900 flex items-center justify-center overflow-hidden">
                      {formData.logo_icon ? (
                        <Image
                          src={formData.logo_icon}
                          alt="Icon"
                          width={40}
                          height={40}
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <span className="text-zinc-600 text-xs">?</span>
                      )}
                    </div>
                    <label>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload('logo_icon', file)
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" className="border-zinc-700 text-zinc-300" asChild>
                        <span><Upload className="h-4 w-4" /></span>
                      </Button>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Favicon (32x32px)</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-[32px] h-[32px] border border-zinc-700 rounded bg-zinc-900 flex items-center justify-center overflow-hidden">
                      {formData.favicon ? (
                        <Image
                          src={formData.favicon}
                          alt="Favicon"
                          width={32}
                          height={32}
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <span className="text-zinc-600 text-xs">?</span>
                      )}
                    </div>
                    <label>
                      <input
                        type="file"
                        accept="image/*,.ico"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload('favicon', file)
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" className="border-zinc-700 text-zinc-300" asChild>
                        <span><Upload className="h-4 w-4" /></span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => handleSave('branding')} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Identidade Visual
            </Button>
          </div>
        </TabsContent>

        {/* Tab: Cores do Tema */}
        <TabsContent value="theme" className="space-y-4">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Paleta de Cores</CardTitle>
              <CardDescription className="text-zinc-400">
                Defina as cores principais do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'color_primary', label: 'Primária', default: '#1E3A8A' },
                  { key: 'color_primary_light', label: 'Primária Clara', default: '#3B82F6' },
                  { key: 'color_secondary', label: 'Secundária', default: '#10B981' },
                  { key: 'color_accent', label: 'Destaque', default: '#F59E0B' },
                  { key: 'color_background_dark', label: 'Fundo Escuro', default: '#0F172A' },
                  { key: 'color_background_light', label: 'Fundo Claro', default: '#F8FAFC' },
                  { key: 'color_text_dark', label: 'Texto Escuro', default: '#111827' },
                  { key: 'color_text_light', label: 'Texto Claro', default: '#F8FAFC' },
                ].map(({ key, label, default: defaultValue }) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-zinc-300">{label}</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData[key] || defaultValue}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <Input
                        value={formData[key] || defaultValue}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="font-mono text-sm bg-zinc-900 border-zinc-700 text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 border border-zinc-700 rounded-lg">
                <Label className="mb-3 block text-zinc-300">Preview</Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Preview Light */}
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: formData.color_background_light || '#F8FAFC' }}
                  >
                    <p style={{ color: formData.color_text_dark || '#111827' }} className="font-bold mb-2">
                      Tema Claro
                    </p>
                    <button
                      className="px-4 py-2 rounded text-white text-sm"
                      style={{ backgroundColor: formData.color_primary || '#1E3A8A' }}
                    >
                      Primário
                    </button>
                    <button
                      className="px-4 py-2 rounded text-white text-sm ml-2"
                      style={{ backgroundColor: formData.color_secondary || '#10B981' }}
                    >
                      Secundário
                    </button>
                  </div>

                  {/* Preview Dark */}
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: formData.color_background_dark || '#0F172A' }}
                  >
                    <p style={{ color: formData.color_text_light || '#F8FAFC' }} className="font-bold mb-2">
                      Tema Escuro
                    </p>
                    <button
                      className="px-4 py-2 rounded text-white text-sm"
                      style={{ backgroundColor: formData.color_primary_light || '#3B82F6' }}
                    >
                      Primário
                    </button>
                    <button
                      className="px-4 py-2 rounded text-sm ml-2"
                      style={{
                        backgroundColor: formData.color_accent || '#F59E0B',
                        color: formData.color_text_dark || '#111827'
                      }}
                    >
                      Destaque
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => handleSave('theme')} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Cores
            </Button>
          </div>
        </TabsContent>

        {/* Tab: Geral */}
        <TabsContent value="general" className="space-y-4">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Informações Gerais</CardTitle>
              <CardDescription className="text-zinc-400">
                Nome e descrição do aplicativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Nome do Aplicativo</Label>
                <Input
                  value={formData.app_name || ''}
                  onChange={(e) => handleChange('app_name', e.target.value)}
                  placeholder="UNICA"
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Descrição</Label>
                <Input
                  value={formData.app_description || ''}
                  onChange={(e) => handleChange('app_description', e.target.value)}
                  placeholder="Clube de Benefícios"
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => handleSave('general')} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Geral
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
