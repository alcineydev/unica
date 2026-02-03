'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useConfig } from '@/contexts/config-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2, Save, Image as ImageIcon, Type, Upload, X,
  User, Mail, Phone, Lock, Palette, Globe, MessageSquare,
  Sun, Moon
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/page-header'

interface FormData {
  // Logo
  logoType: 'image' | 'text'
  logoImageLight: string
  logoImageDark: string
  logoText: string
  logoSize: 'small' | 'medium' | 'large'
  // Identidade
  favicon: string
  siteName: string
  siteDescription: string
  primaryColor: string
  // Contato
  contactEmail: string
  contactPhone: string
  contactWhatsapp: string
  address: string
  // Social
  socialFacebook: string
  socialInstagram: string
  socialLinkedin: string
  // Perfil do usuário
  userName: string
  userEmail: string
  userPhone: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const defaultFormData: FormData = {
  logoType: 'text',
  logoImageLight: '',
  logoImageDark: '',
  logoText: 'UNICA',
  logoSize: 'medium',
  favicon: '',
  siteName: 'UNICA - Clube de Benefícios',
  siteDescription: '',
  primaryColor: '#2563eb',
  contactEmail: '',
  contactPhone: '',
  contactWhatsapp: '',
  address: '',
  socialFacebook: '',
  socialInstagram: '',
  socialLinkedin: '',
  userName: '',
  userEmail: '',
  userPhone: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
}

export default function ConfiguracoesPage() {
  const { data: session, update: updateSession } = useSession()
  const { refetch: refetchConfig } = useConfig()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('identidade')
  const [formData, setFormData] = useState<FormData>(defaultFormData)

  // Carregar dados
  useEffect(() => {
    loadConfig()
  }, [])

  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        userName: session.user.name || '',
        userEmail: session.user.email || '',
        userPhone: (session.user as { phone?: string }).phone || ''
      }))
    }
  }, [session])

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/config')
      if (response.ok) {
        const data = await response.json()
        const configData = data.config || {}

        setFormData(prev => ({
          ...prev,
          // Logo
          logoType: configData.logo?.type || 'text',
          logoImageLight: configData.logo?.imageLight || '',
          logoImageDark: configData.logo?.imageDark || '',
          logoText: configData.logo?.text || 'UNICA',
          logoSize: configData.logo?.size || 'medium',
          // Identidade
          favicon: configData.favicon || '',
          siteName: configData.siteName || '',
          siteDescription: configData.siteDescription || '',
          primaryColor: configData.primaryColor || '#2563eb',
          // Contato
          contactEmail: configData.contactEmail || '',
          contactPhone: configData.contactPhone || '',
          contactWhatsapp: configData.contactWhatsapp || '',
          address: configData.address || '',
          // Social
          socialFacebook: configData.socialFacebook || '',
          socialInstagram: configData.socialInstagram || '',
          socialLinkedin: configData.socialLinkedin || ''
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (field: 'logoImageLight' | 'logoImageDark' | 'favicon', file: File) => {
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unica_unsigned')

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: uploadFormData }
      )
      const data = await response.json()
      if (data.secure_url) {
        handleChange(field, data.secure_url)
        toast.success('Imagem enviada com sucesso!')
      }
    } catch (error) {
      toast.error('Erro ao enviar imagem')
    }
  }

  const handleSaveConfig = async () => {
    setIsSaving(true)
    try {
      const configPayload = {
        logo: {
          type: formData.logoType,
          imageLight: formData.logoImageLight || null,
          imageDark: formData.logoImageDark || null,
          text: formData.logoText,
          size: formData.logoSize
        },
        favicon: formData.favicon || null,
        siteName: formData.siteName,
        siteDescription: formData.siteDescription,
        primaryColor: formData.primaryColor,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        contactWhatsapp: formData.contactWhatsapp,
        address: formData.address,
        socialFacebook: formData.socialFacebook,
        socialInstagram: formData.socialInstagram,
        socialLinkedin: formData.socialLinkedin
      }

      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configPayload)
      })

      if (!response.ok) throw new Error('Erro ao salvar')

      await refetchConfig()
      toast.success('Configurações salvas com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      // Validar senhas
      if (formData.newPassword) {
        if (formData.newPassword.length < 6) {
          toast.error('A nova senha deve ter pelo menos 6 caracteres')
          setIsSaving(false)
          return
        }
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error('As senhas não coincidem')
          setIsSaving(false)
          return
        }
        if (!formData.currentPassword) {
          toast.error('Digite a senha atual')
          setIsSaving(false)
          return
        }
      }

      const response = await fetch('/api/admin/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.userName,
          phone: formData.userPhone,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar')
      }

      await updateSession({
        ...session,
        user: { ...session?.user, name: formData.userName }
      })

      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))

      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = () => {
    if (activeTab === 'perfil') {
      handleSaveProfile()
    } else {
      handleSaveConfig()
    }
  }

  const getLogoSizeValue = (size: string): number => {
    switch (size) {
      case 'small': return 28
      case 'large': return 44
      default: return 36
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Configurações"
          description="Gerencie a aparência do sistema e suas informações pessoais"
        />
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="identidade" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Identidade</span>
          </TabsTrigger>
          <TabsTrigger value="contato" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Contato</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Social</span>
          </TabsTrigger>
          <TabsTrigger value="perfil" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Meu Perfil</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB: IDENTIDADE */}
        <TabsContent value="identidade" className="space-y-6">
          {/* Logo do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Logo do Sistema
              </CardTitle>
              <CardDescription>
                Configure como o logo aparece na sidebar e no header
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tipo de Logo */}
              <div className="space-y-3">
                <Label>Tipo de Logo</Label>
                <RadioGroup
                  value={formData.logoType}
                  onValueChange={(value) => handleChange('logoType', value as 'image' | 'text')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="image" id="logo-image" />
                    <Label htmlFor="logo-image" className="flex items-center gap-2 cursor-pointer">
                      <ImageIcon className="w-4 h-4" />
                      Imagem
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="logo-text" />
                    <Label htmlFor="logo-text" className="flex items-center gap-2 cursor-pointer">
                      <Type className="w-4 h-4" />
                      Texto
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Se tipo IMAGEM */}
              {formData.logoType === 'image' && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Logo Claro */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      Logo para Fundo Claro
                    </Label>
                    <div className="border-2 border-dashed rounded-xl p-4 text-center bg-white">
                      {formData.logoImageLight ? (
                        <div className="relative inline-block">
                          <img
                            src={formData.logoImageLight}
                            alt="Logo claro"
                            className="h-20 object-contain mx-auto"
                          />
                          <button
                            type="button"
                            onClick={() => handleChange('logoImageLight', '')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            title="Remover imagem"
                            aria-label="Remover imagem"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block p-4">
                          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">Clique para enviar</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload('logoImageLight', e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Logo Escuro */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      Logo para Fundo Escuro
                    </Label>
                    <div className="border-2 border-dashed rounded-xl p-4 text-center bg-gray-800">
                      {formData.logoImageDark ? (
                        <div className="relative inline-block">
                          <img
                            src={formData.logoImageDark}
                            alt="Logo escuro"
                            className="h-20 object-contain mx-auto"
                          />
                          <button
                            type="button"
                            onClick={() => handleChange('logoImageDark', '')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            title="Remover imagem"
                            aria-label="Remover imagem"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block p-4">
                          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <span className="text-sm text-gray-400">Clique para enviar</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload('logoImageDark', e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Opcional. Se não enviar, será usado o logo claro.
                    </p>
                  </div>
                </div>
              )}

              {/* Se tipo TEXTO */}
              {formData.logoType === 'text' && (
                <div className="space-y-3">
                  <Label>Texto do Logo</Label>
                  <Input
                    value={formData.logoText}
                    onChange={(e) => handleChange('logoText', e.target.value)}
                    placeholder="UNICA"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500">
                    A primeira letra será usada como ícone. Máximo 20 caracteres.
                  </p>
                </div>
              )}

              {/* Tamanho do Logo */}
              <div className="space-y-3">
                <Label>Tamanho do Logo</Label>
                <Select
                  value={formData.logoSize}
                  onValueChange={(value) => handleChange('logoSize', value as 'small' | 'medium' | 'large')}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno (28px)</SelectItem>
                    <SelectItem value="medium">Médio (36px)</SelectItem>
                    <SelectItem value="large">Grande (44px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preview */}
              <div className="space-y-3">
                <Label>Preview</Label>
                <div className="flex gap-4">
                  <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
                    {formData.logoType === 'image' && formData.logoImageLight ? (
                      <img
                        src={formData.logoImageLight}
                        alt="Preview"
                        style={{ height: getLogoSizeValue(formData.logoSize) }}
                        className="object-contain"
                      />
                    ) : (
                      <div
                        className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold"
                        style={{
                          width: getLogoSizeValue(formData.logoSize),
                          height: getLogoSizeValue(formData.logoSize),
                          fontSize: getLogoSizeValue(formData.logoSize) * 0.45
                        }}
                      >
                        {(formData.logoText || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-bold text-gray-800">{formData.logoText || 'UNICA'}</span>
                  </div>
                  <div className="bg-gray-800 border rounded-xl p-4 flex items-center gap-3">
                    {formData.logoType === 'image' && (formData.logoImageDark || formData.logoImageLight) ? (
                      <img
                        src={formData.logoImageDark || formData.logoImageLight}
                        alt="Preview"
                        style={{ height: getLogoSizeValue(formData.logoSize) }}
                        className="object-contain"
                      />
                    ) : (
                      <div
                        className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold"
                        style={{
                          width: getLogoSizeValue(formData.logoSize),
                          height: getLogoSizeValue(formData.logoSize),
                          fontSize: getLogoSizeValue(formData.logoSize) * 0.45
                        }}
                      >
                        {(formData.logoText || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-bold text-white">{formData.logoText || 'UNICA'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Favicon */}
          <Card>
            <CardHeader>
              <CardTitle>Favicon</CardTitle>
              <CardDescription>
                Ícone que aparece na aba do navegador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-xl p-4 text-center w-fit">
                {formData.favicon ? (
                  <div className="relative inline-block">
                    <img
                      src={formData.favicon}
                      alt="Favicon"
                      className="w-16 h-16 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => handleChange('favicon', '')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      title="Remover favicon"
                      aria-label="Remover favicon"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block p-4">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Enviar Favicon</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload('favicon', e.target.files[0])}
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Sistema</Label>
                  <Input
                    value={formData.siteName}
                    onChange={(e) => handleChange('siteName', e.target.value)}
                    placeholder="UNICA - Clube de Benefícios"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor Principal</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => handleChange('primaryColor', e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => handleChange('primaryColor', e.target.value)}
                      placeholder="#2563eb"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.siteDescription}
                  onChange={(e) => handleChange('siteDescription', e.target.value)}
                  placeholder="Seu clube de benefícios e descontos exclusivos"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: CONTATO */}
        <TabsContent value="contato" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    placeholder="contato@empresa.com.br"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <PhoneInput
                    value={formData.contactPhone}
                    onChange={(value) => handleChange('contactPhone', value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <PhoneInput
                    value={formData.contactWhatsapp}
                    onChange={(value) => handleChange('contactWhatsapp', value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Rua, número, bairro, cidade - UF"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: SOCIAL */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Redes Sociais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={formData.socialFacebook}
                  onChange={(e) => handleChange('socialFacebook', e.target.value)}
                  placeholder="https://facebook.com/suaempresa"
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={formData.socialInstagram}
                  onChange={(e) => handleChange('socialInstagram', e.target.value)}
                  placeholder="https://instagram.com/suaempresa"
                />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input
                  value={formData.socialLinkedin}
                  onChange={(e) => handleChange('socialLinkedin', e.target.value)}
                  placeholder="https://linkedin.com/company/suaempresa"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: MEU PERFIL */}
        <TabsContent value="perfil" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Atualize seu nome e informações de contato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input
                    value={formData.userName}
                    onChange={(e) => handleChange('userName', e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Input
                      value={formData.userEmail}
                      disabled
                      className="bg-gray-50 pr-10"
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">O email não pode ser alterado</p>
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <PhoneInput
                    value={formData.userPhone}
                    onChange={(value) => handleChange('userPhone', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Alterar Senha
              </CardTitle>
              <CardDescription>
                Deixe em branco se não quiser alterar a senha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Senha Atual</Label>
                  <Input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => handleChange('currentPassword', e.target.value)}
                    placeholder="••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <Input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => handleChange('newPassword', e.target.value)}
                    placeholder="••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Nova Senha</Label>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="••••••"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
