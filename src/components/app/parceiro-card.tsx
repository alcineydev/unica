'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Building2, MapPin, MessageCircle, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Benefit {
  id: string
  name: string
  type: string
  value: number
}

interface ParceiroCardProps {
  parceiro: {
    id: string
    name?: string
    companyName?: string
    tradeName?: string | null
    category: string
    logo?: string | null
    banner?: string | null
    whatsapp?: string | null
    city?: {
      name: string
      state?: string
    } | null
    avaliacoes?: {
      media: number
      total: number
    }
    benefits?: Benefit[]
  }
  variant?: 'default' | 'compact'
  className?: string
}

export function ParceiroCard({ parceiro, variant = 'default', className }: ParceiroCardProps) {
  // Suporta tanto 'name' quanto 'companyName/tradeName'
  const displayName = parceiro.name || parceiro.tradeName || parceiro.companyName || 'Parceiro'

  const getBenefitLabel = (benefit: Benefit) => {
    switch (benefit.type) {
      case 'DESCONTO':
      case 'DISCOUNT':
        return `${benefit.value}% OFF`
      case 'CASHBACK':
        return `${benefit.value}% Cashback`
      case 'PONTOS':
      case 'POINTS':
        return `${benefit.value} pts`
      case 'ACESSO_EXCLUSIVO':
      case 'FREEBIE':
        return 'Exclusivo'
      default:
        return benefit.name
    }
  }

  const getWhatsAppLink = () => {
    if (!parceiro.whatsapp) return null
    const phone = parceiro.whatsapp.replace(/\D/g, '')
    const phoneWithCountry = phone.startsWith('55') ? phone : `55${phone}`
    const message = encodeURIComponent(
      `Olá! Sou assinante do UNICA Clube de Benefícios e gostaria de saber mais sobre os benefícios da ${displayName}. 😊`
    )
    return `https://wa.me/${phoneWithCountry}?text=${message}`
  }

  if (variant === 'compact') {
    return (
      <Link href={`/app/parceiros/${parceiro.id}`}>
        <div className={cn(
          "group flex items-center gap-4 p-4 rounded-2xl bg-card border hover:border-primary/50 hover:shadow-lg transition-all duration-300",
          className
        )}>
          {/* Logo */}
          <div className="relative h-14 w-14 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-background shadow-md">
            {parceiro.logo ? (
              <Image
                src={parceiro.logo}
                alt={displayName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <Building2 className="h-6 w-6 text-primary/60" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {displayName}
              </h3>
              {parceiro.avaliacoes && parceiro.avaliacoes.total > 0 && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{parceiro.avaliacoes.media.toFixed(1)}</span>
                </div>
              )}
              {parceiro.benefits && parceiro.benefits[0] && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-0 text-xs font-medium">
                  {getBenefitLabel(parceiro.benefits[0])}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{parceiro.category}</p>
            {parceiro.city && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {parceiro.city.name}
              </p>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className={cn(
      "group rounded-2xl bg-card border overflow-hidden hover:shadow-xl transition-all duration-300",
      className
    )}>
      {/* Banner ou Gradient */}
      <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background">
        {parceiro.banner && (
          <Image
            src={parceiro.banner}
            alt={displayName}
            fill
            className="object-cover"
            unoptimized
          />
        )}
        {/* Badge de benefício */}
        {parceiro.benefits && parceiro.benefits[0] && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-500 hover:bg-green-500 text-white border-0 shadow-lg">
              {getBenefitLabel(parceiro.benefits[0])}
            </Badge>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4 pt-0">
        {/* Logo sobreposta */}
        <div className="relative -mt-10 mb-3">
          <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-card border-4 border-background shadow-lg">
            {parceiro.logo ? (
              <Image
                src={parceiro.logo}
                alt={displayName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <Building2 className="h-8 w-8 text-primary/60" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                {displayName}
              </h3>
              {parceiro.avaliacoes && parceiro.avaliacoes.total > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{parceiro.avaliacoes.media.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({parceiro.avaliacoes.total})</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{parceiro.category}</p>
          </div>

          {parceiro.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {parceiro.city.name}
            </p>
          )}

          {/* Todos os benefícios */}
          {parceiro.benefits && parceiro.benefits.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {parceiro.benefits.map((benefit) => (
                <Badge 
                  key={benefit.id} 
                  variant="outline" 
                  className="text-xs bg-muted/50"
                >
                  {getBenefitLabel(benefit)}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Link href={`/app/parceiros/${parceiro.id}`} className="flex-1">
            <Button variant="default" className="w-full">
              Ver detalhes
            </Button>
          </Link>
          {parceiro.whatsapp && (
            <a href={getWhatsAppLink() || '#'} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" className="bg-green-50 border-green-200 hover:bg-green-100">
                <MessageCircle className="h-4 w-4 text-green-600" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

