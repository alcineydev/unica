'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { Loader2, Save, Camera, Building2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ParceiroConfiguracoesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showLogoUpload, setShowLogoUpload] = useState(false)
  
  const [formData, setFormData] = useState({
    tradeName: '',
    description: '',
    whatsapp: '',
    address: '',
    logo: ''
  })

  useEffect(() => {
    fetchParceiro()
  }, [])

  const fetchParceiro = async () => {
    try {
      const response = await fetch('/api/parceiro/perfil')
      const data = await response.json()
      
      if (data.parceiro) {
        setFormData({
          tradeName: data.parceiro.tradeName || data.parceiro.companyName || '',
          description: data.parceiro.description || '',
          whatsapp: data.parceiro.contact?.whatsapp || '',
          address: data.parceiro.address?.street || '',
          logo: data.parceiro.logo || ''
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
      const response = await fetch('/api/parceiro/perfil', {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie os dados da sua empresa</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base">Logo da Empresa</CardTitle>
            <CardDescription>Imagem que aparece para os assinantes</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="flex items-center gap-4">
              <div className="relative">
                {formData.logo ? (
                  <div className="h-20 w-20 rounded-xl overflow-hidden bg-muted">
                    <img src={formData.logo} alt="Logo" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowLogoUpload(!showLogoUpload)}
                  className="absolute -bottom-1 -right-1 p-2 rounded-full bg-primary text-primary-foreground shadow-lg"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div>
                <p className="font-medium">{formData.tradeName || 'Sua empresa'}</p>
                <p className="text-sm text-muted-foreground">Clique no ícone para alterar</p>
              </div>
            </div>

            {showLogoUpload && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                <ImageUpload
                  value={formData.logo}
                  onChange={(url) => {
                    setFormData(prev => ({ ...prev, logo: url || '' }))
                    setShowLogoUpload(false)
                  }}
                  folder="parceiros/logos"
                  aspectRatio="square"
                  className="w-40 h-40 mx-auto"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dados da Empresa */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base">Dados da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tradeName">Nome Fantasia</Label>
              <Input
                id="tradeName"
                value={formData.tradeName}
                onChange={(e) => setFormData(prev => ({ ...prev, tradeName: e.target.value }))}
                placeholder="Nome da sua empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Breve descrição da sua empresa"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Endereço completo"
              />
            </div>
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </Button>
      </form>
    </div>
  )
}

