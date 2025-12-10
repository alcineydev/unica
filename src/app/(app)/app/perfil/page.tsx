'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  User,
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
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks'

interface PerfilData {
  name: string
  email: string
  cpf: string
  phone: string
  city: {
    name: string
    state: string
  }
  plan: {
    name: string
    price: number
  }
  subscriptionStatus: string
  createdAt: string
}

export default function PerfilPage() {
  const router = useRouter()
  const { logout, isLoading: isLoggingOut } = useAuth()
  const [data, setData] = useState<PerfilData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchPerfil = useCallback(async () => {
    try {
      const response = await fetch('/api/app/perfil')
      const result = await response.json()
      if (response.ok) {
        setData(result.data)
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

  async function handleLogout() {
    try {
      await logout()
      router.push('/login')
    } catch {
      toast.error('Erro ao sair')
    }
  }

  const initials = data?.name
    ? data.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'US'

  const menuItems = [
    {
      icon: Bell,
      label: 'Notificacoes',
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
        <h1 className="text-xl font-bold mb-6">Meu Perfil</h1>
        
        <div className="flex items-center gap-4">
          {isLoading ? (
            <Skeleton className="h-16 w-16 rounded-full bg-white/20" />
          ) : (
            <Avatar className="h-16 w-16 border-2 border-white/30">
              <AvatarFallback className="bg-white text-primary text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            {isLoading ? (
              <>
                <Skeleton className="h-6 w-32 bg-white/20 mb-2" />
                <Skeleton className="h-4 w-48 bg-white/20" />
              </>
            ) : (
              <>
                <p className="text-lg font-bold">{data?.name}</p>
                <p className="text-sm opacity-80">{data?.email}</p>
              </>
            )}
          </div>
        </div>
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
                  ) : (
                    <p className="font-semibold">{data?.plan.name}</p>
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
            {!isLoading && (
              <p className="text-sm text-muted-foreground mt-2">
                {formatCurrency(data?.plan.price || 0)}/mes
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informacoes Pessoais */}
      <div className="px-4 mb-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Informacoes Pessoais
            </h3>
            
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
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
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                {isLoading ? (
                  <Skeleton className="h-5 w-28" />
                ) : (
                  <p className="font-medium">{data?.phone}</p>
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
                ) : (
                  <p className="font-medium">{data?.city.name} - {data?.city.state}</p>
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
            {menuItems.map((item, index) => (
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

      {/* Botao Sair */}
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

