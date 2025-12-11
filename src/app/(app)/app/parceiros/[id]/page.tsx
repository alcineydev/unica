'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  Percent,
  Gift,
  Star,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

interface Benefit {
  id: string
  name: string
  type: string
  description: string
  value: Record<string, unknown>
}

interface Parceiro {
  id: string
  companyName: string
  logo: string | null
  category: string
  description: string | null
  city: {
    id: string
    name: string
    state: string
  }
  address: {
    street?: string
    number?: string
    neighborhood?: string
    zipCode?: string
  }
  contact: {
    whatsapp?: string
    phone?: string
    email?: string
  }
  hours: Array<{
    day: string
    open: string
    close: string
  }>
  beneficios: Benefit[]
}

const CATEGORY_LABELS: Record<string, string> = {
  alimentacao: 'Alimentação',
  saude: 'Saúde',
  beleza: 'Beleza',
  educacao: 'Educação',
  servicos: 'Serviços',
  lazer: 'Lazer',
  comercio: 'Comércio',
  outros: 'Outros',
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo',
  seg: 'Segunda',
  ter: 'Terça',
  qua: 'Quarta',
  qui: 'Quinta',
  sex: 'Sexta',
  sab: 'Sábado',
  dom: 'Domingo',
}

export default function ParceiroDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const [parceiro, setParceiro] = useState<Parceiro | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadParceiro()
  }, [params.id])

  async function loadParceiro() {
    try {
      const response = await fetch(`/api/app/parceiros/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setParceiro(data)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Parceiro não encontrado')
        router.push('/app/parceiros')
      }
    } catch (error) {
      console.error('Erro ao carregar parceiro:', error)
      toast.error('Erro ao carregar parceiro')
    } finally {
      setLoading(false)
    }
  }

  async function handleWhatsAppClick() {
    if (!parceiro?.contact.whatsapp) return

    // Registrar clique
    try {
      await fetch(`/api/app/parceiros/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'whatsapp_click' }),
      })
    } catch (error) {
      console.error('Erro ao registrar clique:', error)
    }

    // Abrir WhatsApp
    const phone = parceiro.contact.whatsapp.replace(/\D/g, '')
    const message = encodeURIComponent(
      `Olá! Sou assinante do Unica Clube de Benefícios e gostaria de mais informações.`
    )
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank')
  }

  function formatPhone(phone: string) {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  function getBenefitIcon(type: string) {
    switch (type) {
      case 'DESCONTO':
        return <Percent className="h-4 w-4" />
      case 'CASHBACK':
        return <Gift className="h-4 w-4" />
      case 'ACESSO_EXCLUSIVO':
        return <Star className="h-4 w-4" />
      default:
        return <Gift className="h-4 w-4" />
    }
  }

  function getBenefitValue(benefit: Benefit) {
    const value = benefit.value as Record<string, number>
    if (benefit.type === 'DESCONTO') {
      return `${value.percentage}% de desconto`
    }
    if (benefit.type === 'CASHBACK') {
      return `${value.percentage}% de cashback`
    }
    return benefit.description
  }

  if (loading) {
    return (
      <div className="space-y-4 pb-20">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    )
  }

  if (!parceiro) {
    return null
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold truncate">{parceiro.companyName}</h1>
      </div>

      {/* Logo e Info Principal */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            {/* Logo */}
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-3xl font-bold shrink-0">
              {parceiro.logo ? (
                <img
                  src={parceiro.logo}
                  alt={parceiro.companyName}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                parceiro.companyName.charAt(0).toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate">{parceiro.companyName}</h2>
              <Badge variant="secondary" className="mt-1">
                {CATEGORY_LABELS[parceiro.category] || parceiro.category}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {parceiro.city.name} - {parceiro.city.state}
              </p>
            </div>
          </div>

          {parceiro.description && (
            <p className="text-sm text-muted-foreground mt-4">
              {parceiro.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Benefícios */}
      {parceiro.beneficios.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="h-4 w-4 text-purple-500" />
              Seus Benefícios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {parceiro.beneficios.map((beneficio) => (
              <div
                key={beneficio.id}
                className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                  {getBenefitIcon(beneficio.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{beneficio.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getBenefitValue(beneficio)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Endereço */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            Endereço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {parceiro.address.street}
            {parceiro.address.number && `, ${parceiro.address.number}`}
          </p>
          {parceiro.address.neighborhood && (
            <p className="text-sm text-muted-foreground">
              {parceiro.address.neighborhood}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {parceiro.city.name} - {parceiro.city.state}
            {parceiro.address.zipCode && ` | CEP: ${parceiro.address.zipCode}`}
          </p>
        </CardContent>
      </Card>

      {/* Horários */}
      {parceiro.hours && parceiro.hours.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              Horário de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {parceiro.hours.map((hour, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {DAY_LABELS[hour.day.toLowerCase()] || hour.day}
                  </span>
                  <span>
                    {hour.open} - {hour.close}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contato */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4 text-amber-500" />
            Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {parceiro.contact.phone && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Telefone</span>
              <a
                href={`tel:${parceiro.contact.phone}`}
                className="text-sm font-medium text-blue-500"
              >
                {formatPhone(parceiro.contact.phone)}
              </a>
            </div>
          )}
          {parceiro.contact.email && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <a
                href={`mailto:${parceiro.contact.email}`}
                className="text-sm font-medium text-blue-500 flex items-center gap-1"
              >
                {parceiro.contact.email}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão WhatsApp Fixo */}
      {parceiro.contact.whatsapp && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent">
          <Button
            onClick={handleWhatsAppClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Conversar no WhatsApp
          </Button>
        </div>
      )}
    </div>
  )
}

