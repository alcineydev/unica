'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ParceiroCard } from '@/components/app/parceiro-card'
import { Search, SlidersHorizontal, Loader2, Building2 } from 'lucide-react'

interface Benefit {
  id: string
  name: string
  type: string
  value: number
}

interface Parceiro {
  id: string
  companyName: string
  tradeName?: string | null
  category: string
  logo?: string | null
  banner?: string | null
  contact?: {
    whatsapp?: string
    phone?: string
  }
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

export default function ParceirosPage() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [filteredParceiros, setFilteredParceiros] = useState<Parceiro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    fetchParceiros()
  }, [])

  useEffect(() => {
    filterParceiros()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter, parceiros])

  const fetchParceiros = async () => {
    try {
      const response = await fetch('/api/app/parceiros')
      const data = await response.json()
      
      if (data.data) {
        setParceiros(data.data)
        
        // Extrair categorias únicas
        const cats = [...new Set(data.data.map((p: Parceiro) => p.category))] as string[]
        setCategories(cats.sort())
      }
    } catch (error) {
      console.error('Erro ao buscar parceiros:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterParceiros = () => {
    let filtered = [...parceiros]

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(p => 
        (p.tradeName || p.companyName).toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower) ||
        p.city?.name.toLowerCase().includes(searchLower)
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter)
    }

    setFilteredParceiros(filtered)
  }

  // Agrupar por categoria
  const groupedParceiros = filteredParceiros.reduce((acc, parceiro) => {
    const category = parceiro.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(parceiro)
    return acc
  }, {} as Record<string, Parceiro[]>)

  // Formatar parceiro para o card
  const formatParceiroForCard = (p: Parceiro) => ({
    id: p.id,
    name: p.tradeName || p.companyName,
    category: p.category,
    logo: p.logo,
    banner: p.banner,
    whatsapp: p.contact?.whatsapp,
    city: p.city,
    avaliacoes: p.avaliacoes,
    benefits: p.benefits
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando parceiros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container max-w-6xl py-6 px-4">
          <h1 className="text-2xl font-bold mb-1">Parceiros</h1>
          <p className="text-muted-foreground">Encontre os melhores benefícios do seu plano</p>
          
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar parceiro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-background">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="container max-w-6xl py-6 px-4">
        {filteredParceiros.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-muted/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum parceiro encontrado</h3>
            <p className="text-muted-foreground">
              {search || categoryFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Os parceiros do seu plano aparecerão aqui'}
            </p>
          </div>
        ) : categoryFilter === 'all' ? (
          // Exibição agrupada por categoria
          <div className="space-y-8">
            {Object.entries(groupedParceiros).map(([category, parceirosCategoria]) => (
              <section key={category}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-foreground">{category}</h2>
                  <Badge variant="secondary" className="rounded-full">
                    {parceirosCategoria.length}
                  </Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {parceirosCategoria.map((parceiro) => (
                    <ParceiroCard 
                      key={parceiro.id} 
                      parceiro={formatParceiroForCard(parceiro)} 
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          // Exibição sem agrupamento
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredParceiros.map((parceiro) => (
              <ParceiroCard 
                key={parceiro.id} 
                parceiro={formatParceiroForCard(parceiro)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
