'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  MapPin,
  Camera,
  Save,
  Loader2,
  Crown,
  Coins,
  ArrowDownUp,
  QrCode,
  Search,
  ChevronRight,
  Upload,
  X,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface Profile {
  id: string
  email: string
  avatar: string | null
  phone: string | null
  createdAt: string
  name: string
  cpf: string | null
  birthDate: string | null
  address: Record<string, string> | null
  plan: {
    id: string
    name: string
    price: number | string
    period?: string
    features?: string[]
  } | null
  planId: string | null
  subscriptionStatus: string
  planStartDate: string | null
  planEndDate: string | null
  points: number
  cashback: number
  qrCode: string | null
  city: { id: string; name: string; state: string } | null
  cityId: string | null
  totalTransactions: number
  totalAvaliacoes: number
}

interface FormData {
  name: string
  phone: string
  cpf: string
  birthDate: string | null
  address: Record<string, string>
}

// ─── Constants ───────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
  PENDING: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  INACTIVE: { label: 'Inativo', color: 'bg-gray-100 text-gray-700' },
  SUSPENDED: { label: 'Suspenso', color: 'bg-red-100 text-red-700' },
  CANCELED: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
  EXPIRED: { label: 'Expirado', color: 'bg-gray-100 text-gray-700' },
  GUEST: { label: 'Convidado', color: 'bg-purple-100 text-purple-700' },
}

// ─── Helpers ─────────────────────────────────────────────

function formatCPF(value: string) {
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatPhone(value: string) {
  const numbers = value.replace(/\D/g, '').slice(0, 11)
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function formatCEP(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2')
}

// ─── Component ───────────────────────────────────────────

export default function PerfilPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [searchingCep, setSearchingCep] = useState(false)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    cpf: '',
    birthDate: null,
    address: {},
  })
  const [hasChanges, setHasChanges] = useState(false)

  // ─── Fetch profile ─────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/app/perfil')
      if (!res.ok) throw new Error('Erro ao carregar perfil')
      const data = await res.json()
      setProfile(data)
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        cpf: data.cpf || '',
        birthDate: data.birthDate || null,
        address: data.address || {},
      })
      setHasChanges(false)
    } catch {
      toast.error('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // ─── Update form ───────────────────────────────────────

  const updateForm = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setHasChanges(true)
  }

  const updateAddress = (field: string, value: string) => {
    updateForm({
      address: { ...formData.address, [field]: value },
    })
  }

  // ─── Search CEP ────────────────────────────────────────

  const searchCEP = async () => {
    const cep = (formData.address?.cep || '').replace(/\D/g, '')
    if (cep.length !== 8) {
      toast.error('CEP deve ter 8 dígitos')
      return
    }
    setSearchingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (data.erro) {
        toast.error('CEP não encontrado')
        return
      }
      updateForm({
        address: {
          ...formData.address,
          cep,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        },
      })
      toast.success('Endereço encontrado!')
    } catch {
      toast.error('Erro ao buscar CEP')
    } finally {
      setSearchingCep(false)
    }
  }

  // ─── Avatar upload ─────────────────────────────────────

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB')
      return
    }

    setUploadingAvatar(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.error || 'Erro no upload')
      }

      const uploadData = await uploadRes.json()
      const avatarUrl = uploadData.url || uploadData.secure_url

      // Salvar avatar no perfil
      const saveRes = await fetch('/api/app/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: avatarUrl }),
      })

      if (!saveRes.ok) throw new Error('Erro ao salvar avatar')

      toast.success('Foto atualizada!')
      await fetchProfile()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao atualizar foto'
      )
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ─── Remove avatar ─────────────────────────────────────

  const removeAvatar = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/app/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: null }),
      })
      if (!res.ok) throw new Error('Erro ao remover foto')
      toast.success('Foto removida!')
      await fetchProfile()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao remover foto'
      )
    } finally {
      setSaving(false)
    }
  }

  // ─── Save ──────────────────────────────────────────────

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/app/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          cpf: formData.cpf,
          birthDate: formData.birthDate,
          address: formData.address,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao salvar')
      }

      toast.success('Perfil atualizado com sucesso!')
      setHasChanges(false)
      await fetchProfile()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao salvar'
      )
    } finally {
      setSaving(false)
    }
  }

  // ─── Loading ───────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!profile) return null

  const statusInfo = STATUS_MAP[profile.subscriptionStatus] || {
    label: profile.subscriptionStatus,
    color: 'bg-gray-100 text-gray-700',
  }
  const memberSince = new Date(profile.createdAt)
  const daysMember = Math.floor(
    (Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24)
  )

  // ─── Render ────────────────────────────────────────────

  return (
    <div className="pb-20 md:pb-6 px-4 lg:px-0 pt-4 lg:pt-0">
      {/* Header Card - Perfil Resumo */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 pt-6 pb-8 -mx-4 -mt-6 md:mx-0 md:mt-0 md:rounded-xl">
        <div className="flex items-center gap-4">
          {/* Avatar com upload */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 border-2 border-white/40 shrink-0">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={profile.name}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white/70" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              aria-label="Selecionar foto de perfil"
              title="Selecionar foto de perfil"
            />
          </div>

          <div className="text-white min-w-0">
            <h1 className="text-xl font-bold truncate">{profile.name}</h1>
            <p className="text-sm text-white/80 truncate">{profile.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}
              >
                {statusInfo.label}
              </span>
              {profile.plan && (
                <span className="text-xs text-white/70 flex items-center gap-1">
                  <Crown className="h-3 w-3" /> {profile.plan.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white/10 rounded-lg p-2.5 text-center">
            <Coins className="h-4 w-4 mx-auto text-white/80 mb-0.5" />
            <p className="text-lg font-bold text-white">
              {profile.points.toFixed(0)}
            </p>
            <p className="text-[10px] text-white/60">Pontos</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2.5 text-center">
            <ArrowDownUp className="h-4 w-4 mx-auto text-white/80 mb-0.5" />
            <p className="text-lg font-bold text-white">
              R$ {profile.cashback.toFixed(2)}
            </p>
            <p className="text-[10px] text-white/60">Cashback</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2.5 text-center">
            <Calendar className="h-4 w-4 mx-auto text-white/80 mb-0.5" />
            <p className="text-lg font-bold text-white">{daysMember}</p>
            <p className="text-[10px] text-white/60">Dias membro</p>
          </div>
        </div>
      </div>

      {/* Avatar actions */}
      {profile.avatar && (
        <div className="flex justify-center -mt-3 mb-2">
          <div className="flex gap-2 bg-white rounded-full shadow-sm border px-3 py-1.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"
              disabled={uploadingAvatar}
            >
              <Upload className="h-3 w-3" /> Trocar foto
            </button>
            <Separator orientation="vertical" className="h-4 my-auto" />
            <button
              onClick={removeAvatar}
              className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
              disabled={saving}
            >
              <X className="h-3 w-3" /> Remover
            </button>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-4 space-y-2">
        <Link
          href="/app/carteira"
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <QrCode className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Minha Carteirinha</p>
              <p className="text-xs text-gray-500">
                QR Code e dados do cartão
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </Link>

        {!profile.plan && (
          <Link
            href="/app/planos"
            className="flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors border border-amber-200"
          >
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-700">
                  Escolher um Plano
                </p>
                <p className="text-xs text-amber-600/70">
                  Ative sua assinatura para acessar benefícios
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-amber-400" />
          </Link>
        )}
      </div>

      {/* Tabs de edição */}
      <div className="mt-6">
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="personal" className="flex-1 text-xs">
              <User className="h-3.5 w-3.5 mr-1" /> Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="address" className="flex-1 text-xs">
              <MapPin className="h-3.5 w-3.5 mr-1" /> Endereço
            </TabsTrigger>
          </TabsList>

          {/* Tab Dados Pessoais */}
          <TabsContent value="personal">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Dados Pessoais</CardTitle>
                <CardDescription className="text-xs">
                  Atualize suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => updateForm({ name: e.target.value })}
                    disabled={saving}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </Label>
                  <Input value={profile.email} disabled className="bg-gray-100" />
                  <p className="text-[10px] text-gray-500">
                    O email não pode ser alterado por aqui. Entre em contato com
                    o suporte.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label
                      htmlFor="cpf"
                      className="text-sm flex items-center gap-1"
                    >
                      <CreditCard className="h-3.5 w-3.5" /> CPF
                    </Label>
                    <Input
                      id="cpf"
                      value={formData.cpf ? formatCPF(formData.cpf) : ''}
                      onChange={(e) =>
                        updateForm({ cpf: e.target.value.replace(/\D/g, '') })
                      }
                      disabled={saving}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-sm flex items-center gap-1"
                    >
                      <Phone className="h-3.5 w-3.5" /> Telefone
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone ? formatPhone(formData.phone) : ''}
                      onChange={(e) =>
                        updateForm({
                          phone: e.target.value.replace(/\D/g, ''),
                        })
                      }
                      disabled={saving}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="birthDate"
                    className="text-sm flex items-center gap-1"
                  >
                    <Calendar className="h-3.5 w-3.5" /> Data de Nascimento
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={
                      formData.birthDate
                        ? new Date(formData.birthDate)
                            .toISOString()
                            .split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      updateForm({ birthDate: e.target.value || null })
                    }
                    disabled={saving}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card do Plano */}
            {profile.plan && (
              <Card className="mt-4 border-blue-200">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <Crown className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {profile.plan.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          R$ {Number(profile.plan.price).toFixed(2)}/
                          {profile.plan.period === 'YEARLY' ? 'ano' : 'mês'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {statusInfo.label}
                    </Badge>
                  </div>
                  {profile.planEndDate && (
                    <p className="text-[10px] text-gray-500 mt-2">
                      Válido até{' '}
                      {new Date(profile.planEndDate).toLocaleDateString(
                        'pt-BR'
                      )}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Endereço */}
          <TabsContent value="address">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Endereço
                </CardTitle>
                <CardDescription className="text-xs">
                  Seu endereço residencial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* CEP com busca */}
                <div className="flex gap-2">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="cep" className="text-sm">
                      CEP
                    </Label>
                    <Input
                      id="cep"
                      value={formatCEP(formData.address?.cep || '')}
                      onChange={(e) =>
                        updateAddress(
                          'cep',
                          e.target.value.replace(/\D/g, '')
                        )
                      }
                      placeholder="00000-000"
                      maxLength={9}
                      disabled={saving}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={searchCEP}
                      disabled={searchingCep || saving}
                      className="h-10 w-10"
                    >
                      {searchingCep ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Logradouro</Label>
                  <Input
                    value={formData.address?.street || ''}
                    onChange={(e) => updateAddress('street', e.target.value)}
                    placeholder="Rua, Avenida..."
                    disabled={saving}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Número</Label>
                    <Input
                      value={formData.address?.number || ''}
                      onChange={(e) => updateAddress('number', e.target.value)}
                      placeholder="Nº"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-sm">Complemento</Label>
                    <Input
                      value={formData.address?.complement || ''}
                      onChange={(e) =>
                        updateAddress('complement', e.target.value)
                      }
                      placeholder="Apto, Bloco..."
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Bairro</Label>
                  <Input
                    value={formData.address?.neighborhood || ''}
                    onChange={(e) =>
                      updateAddress('neighborhood', e.target.value)
                    }
                    placeholder="Bairro"
                    disabled={saving}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2 col-span-2">
                    <Label className="text-sm">Cidade</Label>
                    <Input
                      value={formData.address?.city || ''}
                      onChange={(e) => updateAddress('city', e.target.value)}
                      placeholder="Cidade"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">UF</Label>
                    <Input
                      value={formData.address?.state || ''}
                      onChange={(e) => updateAddress('state', e.target.value)}
                      placeholder="UF"
                      maxLength={2}
                      disabled={saving}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botão Salvar fixo no mobile */}
        {hasChanges && (
          <div className="fixed bottom-16 left-0 right-0 md:static md:mt-6 p-4 md:p-0 bg-[#f8fafc]/95 backdrop-blur-sm border-t border-gray-200 md:border-0 z-40">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-200/40"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        )}

        {/* Info da Conta */}
        <Card className="mt-4 mb-4 border-gray-100">
          <CardContent className="pt-4 pb-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Membro desde</span>
                <span>{memberSince.toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Transações</span>
                <span>{profile.totalTransactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avaliações</span>
                <span>{profile.totalAvaliacoes}</span>
              </div>
              {profile.qrCode && (
                <div className="flex justify-between">
                  <span className="text-gray-500">QR Code</span>
                  <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {profile.qrCode}
                  </code>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
