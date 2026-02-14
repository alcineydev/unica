'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, Building2, MapPin, Phone, Mail, Globe,
  Instagram, Facebook, MessageCircle, Percent, Gift,
  Coins, Loader2, ExternalLink, Star, ChevronRight, X
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
  city?: { name: string; state: string }
  benefits: {
    id: string; name: string; type: string; value: number; description?: string
  }[]
}

interface AssinanteInfo { id: string; name: string; planName: string }

// Helpers
function getBenefitConfig(type: string) {
  const map: Record<string, { icon: typeof Percent; color: string; bg: string; text: string }> = {
    DESCONTO: { icon: Percent, color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-600' },
    DISCOUNT: { icon: Percent, color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-600' },
    CASHBACK: { icon: Coins, color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' },
    PONTOS: { icon: Star, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
    POINTS: { icon: Star, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
    ACESSO_EXCLUSIVO: { icon: Gift, color: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-600' },
    FREEBIE: { icon: Gift, color: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-600' },
  }
  return map[type] || { icon: Gift, color: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-600' }
}

function getBenefitLabel(type: string, value: number) {
  switch (type) {
    case 'DESCONTO': case 'DISCOUNT': return `${value}% de desconto`
    case 'CASHBACK': return `${value}% de cashback`
    case 'PONTOS': case 'POINTS': return `${value} pontos`
    case 'ACESSO_EXCLUSIVO': case 'FREEBIE': return 'Acesso exclusivo'
    default: return 'Benefício exclusivo'
  }
}

function formatPhone(phone: string) {
  const n = phone.replace(/\D/g, '')
  if (n.length === 11) return n.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  return n.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
}

export default function ParceiroDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const parceiroId = params.id as string

  const [parceiro, setParceiro] = useState<Parceiro | null>(null)
  const [assinante, setAssinante] = useState<AssinanteInfo | null>(null)
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
      if (data.parceiro) setParceiro(data.parceiro)
      if (data.assinante) setAssinante(data.assinante)
    } catch (error) {
      console.error('Erro ao buscar parceiro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getWhatsAppLink = () => {
    if (!parceiro?.whatsapp) return null
    const phone = parceiro.whatsapp.replace(/\D/g, '')
    const phoneWithCountry = phone.startsWith('55') ? phone : `55${phone}`
    const assinanteId = assinante?.id?.slice(0, 8) || 'N/A'
    const message = encodeURIComponent(
      `Olá! Sou ${assinante?.name || 'cliente'}, assinante ${assinante?.planName || 'UNICA'}. Meu ID: ${assinanteId}. Vim pelo app UNICA Clube de Benefícios!`
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

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  // Not found
  if (!parceiro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
          <Building2 className="h-10 w-10 text-gray-300" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Parceiro não encontrado</h2>
        <p className="text-sm text-gray-400 text-center mb-6">Este parceiro não existe ou você não tem acesso.</p>
        <Button onClick={() => router.back()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] lg:-mx-8 lg:-mt-6 pb-28">

      {/* ===== HERO BANNER ===== */}
      <div className="relative">
        <div className="h-52 md:h-64 relative overflow-hidden">
          {parceiro.banner ? (
            <>
              <Image src={parceiro.banner} alt={parceiro.name} fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0f172a]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/[0.08] rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4" />
            </div>
          )}

          {/* Botão voltar */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Info sobre o banner */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-end gap-4">
              {/* Logo */}
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border-[3px] border-white shadow-xl shrink-0">
                {parceiro.logo ? (
                  <Image src={parceiro.logo} alt={parceiro.name} width={80} height={80} className="object-cover w-full h-full" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                    <Building2 className="h-8 w-8 text-blue-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pb-0.5">
                <h1 className="text-xl font-bold text-white truncate drop-shadow-sm">{parceiro.name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-[11px]">{parceiro.category}</Badge>
                  {parceiro.city && (
                    <span className="text-[11px] text-white/70 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {parceiro.city.name}, {parceiro.city.state}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONTEÚDO ===== */}
      <div className="px-4 sm:px-6 py-5 space-y-5">

        {/* Benefícios */}
        {parceiro.benefits && parceiro.benefits.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Gift className="h-4 w-4 text-blue-600" /> Seus Benefícios
            </h2>
            <div className="space-y-2.5">
              {parceiro.benefits.map((benefit) => {
                const config = getBenefitConfig(benefit.type)
                const Icon = config.icon
                return (
                  <div key={benefit.id} className="flex items-center gap-3.5 p-3.5 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className={`w-11 h-11 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-5 w-5 ${config.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{benefit.name}</p>
                      <p className={`text-xs font-medium ${config.text}`}>{getBenefitLabel(benefit.type, benefit.value)}</p>
                      {benefit.description && (
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{benefit.description}</p>
                      )}
                    </div>
                    <div className={`w-1.5 h-10 rounded-full ${config.color}`} />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Sobre */}
        {parceiro.description && (
          <section className="p-4 bg-white rounded-xl border border-gray-100">
            <h3 className="font-semibold text-sm text-gray-900 mb-2">Sobre</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{parceiro.description}</p>
          </section>
        )}

        {/* Contato + Localização */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Contato */}
          <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" /> Contato
              </h3>
            </div>
            <div className="p-3 space-y-1.5">
              {parceiro.whatsapp && (
                <a href={getWhatsAppLink() || '#'} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">{formatPhone(parceiro.whatsapp)}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-green-400" />
                </a>
              )}
              {parceiro.phone && parceiro.phone !== parceiro.whatsapp && (
                <a href={`tel:${parceiro.phone}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{formatPhone(parceiro.phone)}</span>
                </a>
              )}
              {parceiro.email && (
                <a href={`mailto:${parceiro.email}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 truncate">{parceiro.email}</span>
                </a>
              )}
              {parceiro.website && (
                <a href={parceiro.website.startsWith('http') ? parceiro.website : `https://${parceiro.website}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 truncate flex-1">{parceiro.website}</span>
                  <ExternalLink className="h-3 w-3 text-gray-300" />
                </a>
              )}

              {(parceiro.instagram || parceiro.facebook) && (
                <>
                  <Separator className="my-2" />
                  <div className="flex gap-2">
                    {parceiro.instagram && (
                      <a href={`https://instagram.com/${parceiro.instagram.replace('@', '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors">
                        <Instagram className="h-4 w-4 text-pink-600" />
                        <span className="text-xs font-medium text-gray-700">Instagram</span>
                      </a>
                    )}
                    {parceiro.facebook && (
                      <a href={parceiro.facebook.startsWith('http') ? parceiro.facebook : `https://facebook.com/${parceiro.facebook}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                        <Facebook className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-gray-700">Facebook</span>
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Localização */}
          {getFullAddress() && (
            <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" /> Localização
                </h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-sm space-y-0.5">
                  {parceiro.address && (
                    <p className="text-gray-900">{parceiro.address}{parceiro.addressNumber && `, ${parceiro.addressNumber}`}</p>
                  )}
                  {parceiro.neighborhood && <p className="text-gray-400 text-xs">{parceiro.neighborhood}</p>}
                  {parceiro.city && <p className="text-gray-600 text-xs">{parceiro.city.name} - {parceiro.city.state}</p>}
                  {parceiro.zipCode && <p className="text-gray-400 text-xs">CEP: {parceiro.zipCode}</p>}
                </div>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getFullAddress() || '')}`}
                  target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full mt-2 rounded-xl text-xs h-9">
                    <MapPin className="mr-1.5 h-3.5 w-3.5" /> Abrir no Google Maps
                  </Button>
                </a>
              </div>
            </section>
          )}
        </div>

        {/* Galeria */}
        {parceiro.gallery && parceiro.gallery.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="font-semibold text-sm text-gray-900">Galeria</h3>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {parceiro.gallery.map((img, index) => (
                  <div key={index}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ring-1 ring-gray-100"
                    onClick={() => setSelectedImage(img)}>
                    <Image src={img} alt={`Foto ${index + 1}`} fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ===== BOTÃO WHATSAPP FIXO ===== */}
      {parceiro.whatsapp && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent z-30">
          <div className="max-w-4xl mx-auto">
            <a href={getWhatsAppLink() || '#'} target="_blank" rel="noopener noreferrer">
              <button
                className="w-full flex items-center justify-center gap-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg shadow-green-200/40 transition-all active:scale-[0.98] py-3.5"
                title="Chamar no WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Chamar no WhatsApp</span>
              </button>
            </a>
            <p className="text-[10px] text-center text-gray-400 mt-1.5">
              Mensagem automática com seus dados de assinante
            </p>
          </div>
        </div>
      )}

      {/* ===== MODAL IMAGEM ===== */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            onClick={() => setSelectedImage(null)}
            title="Fechar imagem"
          >
            <X className="h-4 w-4" />
          </button>
          <Image src={selectedImage} alt="Imagem ampliada" width={1200} height={800}
            className="object-contain max-h-[90vh] rounded-lg" unoptimized />
        </div>
      )}
    </div>
  )
}
