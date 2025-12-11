'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Store,
  Search,
  MapPin,
  Phone,
  Percent,
  Filter,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PARTNER_CATEGORIES } from '@/constants'

interface Parceiro {
  id: string
  companyName: string
  tradeName: string
  category: string
  description: string
  city: {
    name: string
  }
  contact: {
    whatsapp: string
    phone: string
  }
}

export default function ParceirosPage() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  const fetchParceiros = useCallback(async () => {
    try {
      const response = await fetch('/api/app/parceiros')
      const result = await response.json()
      if (response.ok) {
        setParceiros(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar parceiros:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchParceiros()
  }, [fetchParceiros])

  // Filtrar parceiros
  const filteredParceiros = parceiros.filter(p => {
    const matchesSearch = 
      p.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (p.tradeName && p.tradeName.toLowerCase().includes(search.toLowerCase())) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory
    return matchesSearch && matchesCategory
  })

  // Agrupar por categoria
  const groupedParceiros = filteredParceiros.reduce((acc, p) => {
    if (!acc[p.category]) {
      acc[p.category] = []
    }
    acc[p.category].push(p)
    return acc
  }, {} as Record<string, Parceiro[]>)

  function openWhatsApp(phone: string, name: string) {
    const message = encodeURIComponent(`Ola! Vi voces no Unica Clube e gostaria de saber mais sobre os beneficios.`)
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b px-4 py-4 space-y-3">
        <h1 className="text-xl font-bold">Parceiros</h1>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar parceiro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[130px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {PARTNER_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista */}
      <div className="px-4 py-4 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : filteredParceiros.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search || filterCategory !== 'all'
                ? 'Nenhum parceiro encontrado'
                : 'Nenhum parceiro disponivel'}
            </p>
          </div>
        ) : filterCategory === 'all' ? (
          // Agrupado por categoria
          Object.entries(groupedParceiros).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                {PARTNER_CATEGORIES.find(c => c.value === category)?.label || category}
              </h2>
              <div className="space-y-3">
                {items.map((parceiro) => (
                  <ParceiroCard 
                    key={parceiro.id} 
                    parceiro={parceiro}
                    onWhatsApp={() => openWhatsApp(parceiro.contact.whatsapp, parceiro.companyName)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Lista simples
          <div className="space-y-3">
            {filteredParceiros.map((parceiro) => (
              <ParceiroCard 
                key={parceiro.id} 
                parceiro={parceiro}
                onWhatsApp={() => openWhatsApp(parceiro.contact.whatsapp, parceiro.companyName)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ParceiroCard({ 
  parceiro, 
  onWhatsApp 
}: { 
  parceiro: Parceiro
  onWhatsApp: () => void 
}) {
  return (
    <Link href={`/app/parceiros/${parceiro.id}`}>
      <Card className="overflow-hidden hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-3 shrink-0">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {parceiro.tradeName || parceiro.companyName}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {parceiro.description || parceiro.category}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 bg-green-500/10 text-green-600 border-green-500/20">
                  <Percent className="h-3 w-3 mr-1" />
                  Desconto
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {parceiro.city.name}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs gap-1"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onWhatsApp()
                  }}
                >
                  <Phone className="h-3 w-3" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

