'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook,
  MessageCircle,
  Percent,
  Gift,
  Coins,
  Loader2,
  ExternalLink,
  Star,
  ChevronRight,
  X
} from 'lucide-react'

interface Parceiro {
  id: string
  name: string
  tradeName?: string
  description?: string
  category: string
  logo?: string
  banner?: string
  gallery: string[]
  phone?: string
  whatsapp?: string
  email?: string
  website?: string
  instagram?: string
  facebook?: string
  address?: string
  addressNumber?: string
  neighborhood?: string
  complement?: string
  zipCode?: string
  city?: {
    name: string
    state: string
  }
  benefits: {
    id: string
    name: string
    type: string
    value: number
    description?: string
  }[]
}

export default function ParceiroDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const parceiroId = params.id as string

  const [parceiro, setParceiro] = useState<Parceiro | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    fetchParceiro()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parceiroId])

  const fetchParceiro = async () => {
    try {
      const response = await fetch(`/api/app/parceiros/${parceiroId}`)
      const data = await response.json()
      
      if (data.parceiro) {
        setParceiro(data.parceiro)
      }
    } catch (error) {
      console.error('Erro ao buscar parceiro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '')
    if (numbers.length === 11) {
      return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
    }
    return numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
  }

  const getWhatsAppLink = () => {
    if (!parceiro?.whatsapp) return null
    const phone = parceiro.whatsapp.replace(/\D/g, '')
    const phoneWithCountry = phone.startsWith('55') ? phone : `55${phone}`
    const message = encodeURIComponent(
      `Olá! Sou assinante do UNICA Clube de Benefícios e gostaria de utilizar meus benefícios na ${parceiro.name}! 🎉`
    )
    return `https://wa.me/${phoneWithCountry}?text=${message}`
  }

  const getFullAddress = () => {
    if (!parceiro) return null
    const parts = []
    if (parceiro.address) {
      let addr = parceiro.address
      if (parceiro.addressNumber) addr += `, ${parceiro.addressNumber}`
      parts.push(addr)
    }
    if (parceiro.neighborhood) parts.push(parceiro.neighborhood)
    if (parceiro.city) parts.push(`${parceiro.city.name} - ${parceiro.city.state}`)
    return parts.length > 0 ? parts.join(' • ') : null
  }

  const getBenefitIcon = (type: string) => {
    switch (type) {
      case 'DESCONTO':
      case 'DISCOUNT': return <Percent className="h-5 w-5" />
      case 'CASHBACK': return <Coins className="h-5 w-5" />
      case 'PONTOS':
      case 'POINTS': return <Star className="h-5 w-5" />
      case 'ACESSO_EXCLUSIVO':
      case 'FREEBIE': return <Gift className="h-5 w-5" />
      default: return <Gift className="h-5 w-5" />
    }
  }

  const getBenefitColor = (type: string) => {
    switch (type) {
      case 'DESCONTO':
      case 'DISCOUNT': return 'bg-green-500'
      case 'CASHBACK': return 'bg-yellow-500'
      case 'PONTOS':
      case 'POINTS': return 'bg-blue-500'
      case 'ACESSO_EXCLUSIVO':
      case 'FREEBIE': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getBenefitTextColor = (type: string) => {
    switch (type) {
      case 'DESCONTO':
      case 'DISCOUNT': return 'text-green-500'
      case 'CASHBACK': return 'text-yellow-500'
      case 'PONTOS':
      case 'POINTS': return 'text-blue-500'
      case 'ACESSO_EXCLUSIVO':
      case 'FREEBIE': return 'text-purple-500'
      default: return 'text-gray-500'
    }
  }

  const getBenefitText = (benefit: { type: string; value: number }) => {
    switch (benefit.type) {
      case 'DESCONTO':
      case 'DISCOUNT': return `${benefit.value}% de desconto`
      case 'CASHBACK': return `${benefit.value}% de cashback`
      case 'PONTOS':
      case 'POINTS': return `${benefit.value} pontos`
      case 'ACESSO_EXCLUSIVO':
      case 'FREEBIE': return 'Acesso exclusivo'
      default: return 'Benefício exclusivo'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!parceiro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="bg-muted/50 rounded-full w-20 h-20 flex items-center justify-center mb-4">
          <Building2 className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Parceiro não encontrado</h2>
        <p className="text-muted-foreground text-center mb-6">
          Este parceiro não existe ou você não tem acesso.
        </p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background pb-28">
      {/* Header com Banner */}
      <div className="relative">
        {/* Banner */}
        <div className="h-48 md:h-64 bg-gradient-to-br from-primary/30 via-primary/20 to-primary/5">
          {parceiro.banner && (
            <Image
              src={parceiro.banner}
              alt={parceiro.name}
              fill
              className="object-cover"
              unoptimized
            />
          )}
          {/* Overlay gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        {/* Botão Voltar */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 rounded-full shadow-lg bg-background/80 backdrop-blur-sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Logo e Título */}
        <div className="container max-w-4xl relative -mt-16 px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Logo */}
            <div className="relative h-28 w-28 rounded-2xl overflow-hidden bg-card border-4 border-background shadow-xl">
              {parceiro.logo ? (
                <Image
                  src={parceiro.logo}
                  alt={parceiro.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <Building2 className="h-12 w-12 text-primary/60" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-bold">{parceiro.name}</h1>
                <Badge variant="secondary">{parceiro.category}</Badge>
              </div>
              {parceiro.city && (
                <p className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {parceiro.city.name}, {parceiro.city.state}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container max-w-4xl px-4 py-6 space-y-6">
        
        {/* Benefícios em destaque */}
        {parceiro.benefits && parceiro.benefits.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Seus Benefícios
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {parceiro.benefits.map((benefit) => (
                <Card key={benefit.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <div className={`w-2 ${getBenefitColor(benefit.type)}`} />
                      <div className="flex items-center gap-4 p-4 flex-1">
                        <div className={`p-3 rounded-xl ${getBenefitColor(benefit.type)} bg-opacity-10`}>
                          <div className={getBenefitTextColor(benefit.type)}>
                            {getBenefitIcon(benefit.type)}
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold">{benefit.name}</p>
                          <p className="text-sm text-green-600 font-medium">
                            {getBenefitText(benefit)}
                          </p>
                          {benefit.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {benefit.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Descrição */}
        {parceiro.description && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Sobre</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {parceiro.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contato e Localização */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Contato */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                Contato
              </h3>
              
              <div className="space-y-2">
                {parceiro.whatsapp && (
                  <a 
                    href={getWhatsAppLink() || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">{formatPhone(parceiro.whatsapp)}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-green-600" />
                  </a>
                )}

                {parceiro.phone && parceiro.phone !== parceiro.whatsapp && (
                  <a 
                    href={`tel:${parceiro.phone}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatPhone(parceiro.phone)}</span>
                  </a>
                )}

                {parceiro.email && (
                  <a 
                    href={`mailto:${parceiro.email}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{parceiro.email}</span>
                  </a>
                )}

                {parceiro.website && (
                  <a 
                    href={parceiro.website.startsWith('http') ? parceiro.website : `https://${parceiro.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{parceiro.website}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                  </a>
                )}
              </div>

              {/* Redes sociais */}
              {(parceiro.instagram || parceiro.facebook) && (
                <>
                  <Separator />
                  <div className="flex gap-2">
                    {parceiro.instagram && (
                      <a 
                        href={`https://instagram.com/${parceiro.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-colors"
                      >
                        <Instagram className="h-5 w-5 text-pink-600" />
                        <span className="text-sm font-medium">Instagram</span>
                      </a>
                    )}
                    {parceiro.facebook && (
                      <a 
                        href={parceiro.facebook.startsWith('http') ? parceiro.facebook : `https://facebook.com/${parceiro.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                      >
                        <Facebook className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium">Facebook</span>
                      </a>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Localização */}
          {getFullAddress() && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Localização
                </h3>
                
                <div className="space-y-1 text-sm">
                  {parceiro.address && (
                    <p>{parceiro.address}{parceiro.addressNumber && `, ${parceiro.addressNumber}`}</p>
                  )}
                  {parceiro.neighborhood && (
                    <p className="text-muted-foreground">{parceiro.neighborhood}</p>
                  )}
                  {parceiro.city && (
                    <p>{parceiro.city.name} - {parceiro.city.state}</p>
                  )}
                  {parceiro.zipCode && (
                    <p className="text-muted-foreground">CEP: {parceiro.zipCode}</p>
                  )}
                </div>

                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getFullAddress() || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full mt-2">
                    <MapPin className="mr-2 h-4 w-4" />
                    Abrir no Google Maps
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Galeria */}
        {parceiro.gallery && parceiro.gallery.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Galeria</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {parceiro.gallery.map((img, index) => (
                  <div 
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImage(img)}
                  >
                    <Image
                      src={img}
                      alt={`Foto ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Botão WhatsApp fixo */}
      {parceiro.whatsapp && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="container max-w-4xl">
            <a href={getWhatsAppLink() || '#'} target="_blank" rel="noopener noreferrer">
              <Button className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 shadow-lg">
                <MessageCircle className="mr-2 h-6 w-6" />
                Falar no WhatsApp
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* Modal de imagem ampliada */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 right-4 rounded-full"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          <Image
            src={selectedImage}
            alt="Imagem ampliada"
            width={1200}
            height={800}
            className="object-contain max-h-[90vh] rounded-lg"
            unoptimized
          />
        </div>
      )}
    </div>
  )
}
