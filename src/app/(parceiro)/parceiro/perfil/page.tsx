'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Loader2,
  Save,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

interface ParceiroData {
  id: string
  companyName: string
  tradeName: string
  cnpj: string
  category: string
  description: string
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
  user: {
    email: string
  }
}

export default function ParceiroPerfilPage() {
  const [data, setData] = useState<ParceiroData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    tradeName: '',
    description: '',
    whatsapp: '',
    phone: '',
    weekdays: '',
    saturday: '',
    sunday: '',
  })

  const fetchPerfil = useCallback(async () => {
    try {
      const response = await fetch('/api/parceiro/perfil')
      const result = await response.json()
      if (response.ok) {
        setData(result.data)
        setFormData({
          tradeName: result.data.tradeName || '',
          description: result.data.description || '',
          whatsapp: result.data.contact?.whatsapp || '',
          phone: result.data.contact?.phone || '',
          weekdays: result.data.hours?.weekdays || '',
          saturday: result.data.hours?.saturday || '',
          sunday: result.data.hours?.sunday || '',
        })
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPerfil()
  }, [fetchPerfil])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/parceiro/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Perfil atualizado com sucesso!')
        fetchPerfil()
      } else {
        toast.error(result.error || 'Erro ao atualizar perfil')
      }
    } catch {
      toast.error('Erro ao atualizar perfil')
    } finally {
      setIsSubmitting(false)
    }
  }

  function formatCNPJ(cnpj: string): string {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie as informacoes da sua empresa
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card de Informacoes Fixas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados da Empresa
            </CardTitle>
            <CardDescription>
              Informacoes cadastrais (somente leitura)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Razao Social</Label>
              <p className="font-medium">{data?.companyName}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">CNPJ</Label>
              <p className="font-medium">{data?.cnpj ? formatCNPJ(data.cnpj) : '-'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Categoria</Label>
              <Badge variant="outline">{data?.category}</Badge>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Cidade</Label>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{data?.city.name} - {data?.city.state}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Email de Acesso</Label>
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{data?.user.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Informacoes Editaveis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Informacoes de Contato
            </CardTitle>
            <CardDescription>
              Atualize suas informacoes de contato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tradeName">Nome Fantasia</Label>
                <Input
                  id="tradeName"
                  value={formData.tradeName}
                  onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                  placeholder="Nome fantasia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descricao</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva sua empresa..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="66999999999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="6633333333"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alteracoes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Card de Horarios */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horario de Funcionamento
            </CardTitle>
            <CardDescription>
              Informe seus horarios de atendimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="weekdays">Segunda a Sexta</Label>
                <Input
                  id="weekdays"
                  value={formData.weekdays}
                  onChange={(e) => setFormData({ ...formData, weekdays: e.target.value })}
                  placeholder="08:00 - 18:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saturday">Sabado</Label>
                <Input
                  id="saturday"
                  value={formData.saturday}
                  onChange={(e) => setFormData({ ...formData, saturday: e.target.value })}
                  placeholder="08:00 - 12:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sunday">Domingo</Label>
                <Input
                  id="sunday"
                  value={formData.sunday}
                  onChange={(e) => setFormData({ ...formData, sunday: e.target.value })}
                  placeholder="Fechado"
                />
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

