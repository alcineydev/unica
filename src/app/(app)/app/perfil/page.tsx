'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  MapPin,
  Crown,
  Camera,
  Loader2,
  Star,
  Wallet,
  QrCode,
  Clock,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface Perfil {
  id: string
  nome: string
  email: string
  telefone: string
  cpf: string
  avatar?: string
  dataNascimento?: string
  endereco?: {
    cep?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    estado?: string
  }
  plano?: {
    id: string
    nome: string
  }
  status: string
  pontos: number
  cashback: number
  qrCode?: string
  membroDesde: string
}

export default function PerfilPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [formData, setFormData] = useState<Partial<Perfil>>({})

  useEffect(() => {
    fetchPerfil()
  }, [])

  const fetchPerfil = async () => {
    try {
      const response = await fetch('/api/app/perfil')
      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      setPerfil(data.perfil)
      setFormData(data.perfil)
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
      toast.error('Erro ao carregar perfil')
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateEndereco = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      endereco: { ...prev.endereco, [field]: value }
    }))
  }

  // Máscaras
  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 8)
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  // Buscar CEP
  const buscarCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: {
            ...prev.endereco,
            cep: cepLimpo,
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || ''
          }
        }))
        toast.success('Endereço encontrado!')
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }

  // Upload de avatar
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida')
      return
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB')
      return
    }

    setIsUploadingAvatar(true)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('folder', 'avatars')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })

      const data = await response.json()

      if (data.url) {
        setFormData(prev => ({ ...prev, avatar: data.url }))
        toast.success('Foto atualizada!')
      } else {
        toast.error('Erro ao fazer upload')
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao fazer upload da foto')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const response = await fetch('/api/app/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          telefone: formData.telefone?.replace(/\D/g, ''),
          dataNascimento: formData.dataNascimento,
          endereco: formData.endereco,
          avatar: formData.avatar
        })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erro ao salvar')
        return
      }

      toast.success('Perfil atualizado com sucesso!')
      fetchPerfil()

    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar alterações')
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      case 'INACTIVE':
        return <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Perfil não encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </>
          )}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Resumo */}
        <div className="space-y-6">
          {/* Card do Perfil */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="h-28 w-28">
                  <AvatarImage src={formData.avatar} />
                  <AvatarFallback className="text-3xl bg-primary/10">
                    {perfil.nome?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <h2 className="text-xl font-semibold">{perfil.nome}</h2>
              <p className="text-muted-foreground">{perfil.email}</p>
              <div className="mt-3">
                {getStatusBadge(perfil.status)}
              </div>
            </CardContent>
          </Card>

          {/* Card do Plano */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Meu Plano</span>
              </div>
              {perfil.plano ? (
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{perfil.plano.nome}</span>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground mb-3">Você ainda não tem um plano</p>
                  <Link href="/planos">
                    <Button size="sm" className="w-full">Ver Planos</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Saldo */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Meu Saldo</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>Pontos</span>
                  </div>
                  <span className="text-xl font-bold">{perfil.pontos}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-500" />
                    <span>Cashback</span>
                  </div>
                  <span className="text-xl font-bold">R$ {Number(perfil.cashback).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Membro desde */}
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Membro desde</p>
                <p className="font-medium">
                  {new Date(perfil.membroDesde).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Formulário */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="dados" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
                  <TabsTrigger value="endereco">Endereço</TabsTrigger>
                </TabsList>

                {/* Tab Dados Pessoais */}
                <TabsContent value="dados" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="nome"
                          className="pl-10"
                          value={formData.nome || ''}
                          onChange={(e) => updateField('nome', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          className="pl-10 bg-muted"
                          value={perfil.email || ''}
                          disabled
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Email não pode ser alterado</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="cpf"
                          className="pl-10 bg-muted"
                          value={perfil.cpf ? maskCPF(perfil.cpf) : ''}
                          disabled
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">CPF não pode ser alterado</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="telefone"
                          className="pl-10"
                          value={formData.telefone ? maskPhone(formData.telefone) : ''}
                          onChange={(e) => updateField('telefone', e.target.value.replace(/\D/g, ''))}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dataNascimento"
                        type="date"
                        className="pl-10"
                        value={formData.dataNascimento || ''}
                        onChange={(e) => updateField('dataNascimento', e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab Endereço */}
                <TabsContent value="endereco" className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="cep"
                          className="pl-10"
                          value={formData.endereco?.cep ? maskCEP(formData.endereco.cep) : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            updateEndereco('cep', value)
                            if (value.length === 8) {
                              buscarCEP(value)
                            }
                          }}
                          placeholder="00000-000"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="logradouro">Logradouro</Label>
                      <Input
                        id="logradouro"
                        value={formData.endereco?.logradouro || ''}
                        onChange={(e) => updateEndereco('logradouro', e.target.value)}
                        placeholder="Rua, Avenida..."
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numero">Número</Label>
                      <Input
                        id="numero"
                        value={formData.endereco?.numero || ''}
                        onChange={(e) => updateEndereco('numero', e.target.value)}
                        placeholder="123"
                      />
                    </div>

                    <div className="md:col-span-3 space-y-2">
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input
                        id="complemento"
                        value={formData.endereco?.complemento || ''}
                        onChange={(e) => updateEndereco('complemento', e.target.value)}
                        placeholder="Apto, Bloco..."
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        value={formData.endereco?.bairro || ''}
                        onChange={(e) => updateEndereco('bairro', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={formData.endereco?.cidade || ''}
                        onChange={(e) => updateEndereco('cidade', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Input
                        id="estado"
                        value={formData.endereco?.estado || ''}
                        onChange={(e) => updateEndereco('estado', e.target.value.toUpperCase())}
                        maxLength={2}
                        placeholder="UF"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Link para Carteirinha */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <Link href="/app/carteira" className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <QrCode className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Minha Carteirinha</h3>
                    <p className="text-sm text-muted-foreground">
                      Ver QR Code para usar nos parceiros
                    </p>
                  </div>
                </div>
                <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
