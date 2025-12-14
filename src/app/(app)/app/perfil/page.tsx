'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import {
  Mail,
  Phone,
  MapPin,
  CreditCard,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  HelpCircle,
  Loader2,
  Camera,
  Pencil,
  Save,
  X,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { UserAvatar } from '@/components/ui/user-avatar'
import { ImageUpload } from '@/components/ui/image-upload'
import { useAuth } from '@/hooks'

interface PerfilData {
  name: string
  email: string
  cpf: string
  phone: string
  avatar: string | null
  city: {
    name: string
    state: string
  } | null
  plan: {
    name: string
    price: number
  } | null
  subscriptionStatus: string
  createdAt: string
}

export default function PerfilPage() {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()
  const { logout, isLoading: isLoggingOut } = useAuth()
  const [data, setData] = useState<PerfilData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar: ''
  })

  const fetchPerfil = useCallback(async () => {
    try {
      const response = await fetch('/api/app/profile')
      const result = await response.json()
      if (response.ok && result.user) {
        setData(result.user)
        setFormData({
          name: result.user.name || '',
          phone: result.user.phone || '',
          avatar: result.user.avatar || ''
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

  function formatCPF(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  function formatPhone(value: string) {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3')
    }
    return value
  }

  async function handleLogout() {
    try {
      await logout()
      router.push('/login')
    } catch {
      toast.error('Erro ao sair')
    }
  }

  async function handleSave() {
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/app/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Perfil atualizado com sucesso!')
        // Atualizar dados locais
        setData(prev => prev ? { ...prev, name: formData.name, phone: formData.phone, avatar: formData.avatar } : null)
        // Atualizar sessão para refletir mudanças
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: formData.name,
            avatar: formData.avatar
          }
        })
        setIsEditing(false)
        setShowAvatarUpload(false)
      } else {
        toast.error('Erro ao atualizar perfil')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao atualizar perfil')
    } finally {
      setIsSaving(false)
    }
  }

  function handleAvatarChange(url: string | null) {
    setFormData(prev => ({ ...prev, avatar: url || '' }))
  }

  function handleCancel() {
    setFormData({
      name: data?.name || '',
      phone: data?.phone || '',
      avatar: data?.avatar || ''
    })
    setIsEditing(false)
    setShowAvatarUpload(false)
  }

  const menuItems = [
    {
      icon: Bell,
      label: 'Notificações',
      onClick: () => toast.info('Em breve!'),
    },
    {
      icon: Shield,
      label: 'Privacidade',
      onClick: () => toast.info('Em breve!'),
    },
    {
      icon: HelpCircle,
      label: 'Ajuda',
      onClick: () => toast.info('Em breve!'),
    },
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header com Avatar */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-4 pt-8 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Meu Perfil</h1>
          {!isEditing ? (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary-foreground hover:bg-white/20"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary-foreground hover:bg-white/20"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary-foreground hover:bg-white/20"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {isLoading ? (
            <Skeleton className="h-16 w-16 rounded-full bg-white/20" />
          ) : (
            <div className="relative">
              <UserAvatar 
                src={isEditing ? formData.avatar : data?.avatar} 
                name={isEditing ? formData.name : data?.name} 
                size="xl"
                className="border-2 border-white/30"
              />
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setShowAvatarUpload(!showAvatarUpload)}
                  className="absolute -bottom-1 -right-1 p-2 rounded-full bg-white text-primary shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          <div className="flex-1">
            {isLoading ? (
              <>
                <Skeleton className="h-6 w-32 bg-white/20 mb-2" />
                <Skeleton className="h-4 w-48 bg-white/20" />
              </>
            ) : isEditing ? (
              <div className="space-y-2">
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Seu nome"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                />
                <p className="text-sm opacity-80">{data?.email}</p>
              </div>
            ) : (
              <>
                <p className="text-lg font-bold">{data?.name}</p>
                <p className="text-sm opacity-80">{data?.email}</p>
              </>
            )}
          </div>
        </div>

        {/* Upload de Avatar (expansível) */}
        {isEditing && showAvatarUpload && (
          <div className="mt-4 p-4 rounded-lg bg-white/10 backdrop-blur">
            <p className="text-sm mb-3 text-white/80">
              Escolha uma nova foto de perfil
            </p>
            <ImageUpload
              value={formData.avatar}
              onChange={handleAvatarChange}
              folder="avatars"
              aspectRatio="square"
              className="w-32 h-32 mx-auto"
              enableCrop={true}
            />
          </div>
        )}
      </div>

      {/* Card de Plano */}
      <div className="px-4 -mt-12 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seu plano</p>
                  {isLoading ? (
                    <Skeleton className="h-5 w-24 mt-1" />
                  ) : data?.plan ? (
                    <p className="font-semibold">{data.plan.name}</p>
                  ) : (
                    <p className="font-semibold text-muted-foreground">Sem plano</p>
                  )}
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <Badge 
                  variant="outline"
                  className={
                    data?.subscriptionStatus === 'ACTIVE'
                      ? 'bg-green-500/10 text-green-600 border-green-500/20'
                      : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                  }
                >
                  {data?.subscriptionStatus === 'ACTIVE' ? 'Ativo' : 'Pendente'}
                </Badge>
              )}
            </div>
            {!isLoading && data?.plan && (
              <p className="text-sm text-muted-foreground mt-2">
                {formatCurrency(data.plan.price)}/mês
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações Pessoais */}
      <div className="px-4 mb-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Informações Pessoais
            </h3>
            
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">CPF</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-32" />
                ) : (
                  <p className="font-medium">{formatCPF(data?.cpf || '')}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-48" />
                ) : (
                  <p className="font-medium">{data?.email}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Telefone</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-28" />
                ) : isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                    placeholder="(00) 00000-0000"
                    className="mt-1 h-8"
                  />
                ) : (
                  <p className="font-medium">{data?.phone || 'Não informado'}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Cidade</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-36" />
                ) : data?.city ? (
                  <p className="font-medium">{data.city.name} - {data.city.state}</p>
                ) : (
                  <p className="font-medium text-muted-foreground">Não informado</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu */}
      <div className="px-4 mb-4">
        <Card>
          <CardContent className="p-0">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Botão Sair */}
      <div className="px-4">
        <Button 
          variant="outline" 
          className="w-full text-destructive hover:text-destructive"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Sair da conta
        </Button>
      </div>
    </div>
  )
}
