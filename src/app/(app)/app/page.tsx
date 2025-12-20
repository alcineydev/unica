'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Store,
  ChevronRight,
  Crown,
  Star,
  Zap,
  ArrowRight,
  Search,
  Utensils,
  ShoppingBag,
  Car,
  Dumbbell,
  Scissors,
  Heart,
  GraduationCap,
  LayoutGrid
} from 'lucide-react'
import { toast } from 'sonner'

// Mapa de ícones por categoria
const categoryIcons: Record<string, React.ReactNode> = {
  'Alimentação': <Utensils className="h-5 w-5" />,
  'Restaurante': <Utensils className="h-5 w-5" />,
  'Loja': <ShoppingBag className="h-5 w-5" />,
  'Varejo': <ShoppingBag className="h-5 w-5" />,
  'Automotivo': <Car className="h-5 w-5" />,
  'Academia': <Dumbbell className="h-5 w-5" />,
  'Fitness': <Dumbbell className="h-5 w-5" />,
  'Beleza': <Scissors className="h-5 w-5" />,
  'Saúde': <Heart className="h-5 w-5" />,
  'Educação': <GraduationCap className="h-5 w-5" />,
}

interface Parceiro {
  id: string
  companyName: string
  tradeName: string | null
  category: string
  description: string | null
  logo: string | null
  city: { name: string } | null
  avaliacoes?: {
    media: number
    total: number
  }
  benefits?: Array<{
    id: string
    name: string
    type: string
    value: number
  }>
}

interface Plan {
  id: string
  name: string
  slug: string | null
  description: string
  price: number
  priceMonthly: number | null
  planBenefits: Array<{
    benefit: {
      id: string
      name: string
      type: string
    }
  }>
}

interface HomeData {
  assinante: {
    name: string
    points: number
    cashback: number
    planId: string | null
    subscriptionStatus: string
    planStartDate: string | null
    planEndDate: string | null
    plan: {
      name: string
      planBenefits: Array<{
        benefit: {
          id: string
          name: string
          type: string
        }
      }>
    } | null
  }
  parceiros: Parceiro[]
  totalBeneficios: number
  categorias: string[]
  planosDisponiveis?: Plan[]
}

export default function AssinanteDashboard() {
  const [data, setData] = useState<HomeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/app/home')
      const result = await response.json()

      if (result.error) {
        toast.error(result.error)
        return
      }

      setData(result.data)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Filtrar parceiros
  const filteredParceiros = useMemo(() => {
    if (!data?.parceiros) return []

    let filtered = data.parceiros

    // Filtro por categoria
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        (p.tradeName || p.companyName).toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [data?.parceiros, selectedCategory, searchQuery])

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-12 rounded-xl" />
        <div className="flex gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-16 w-16 rounded-xl flex-shrink-0" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  // Verifica se tem plano ativo
  const isPlanActive = data?.assinante?.planId && data?.assinante?.subscriptionStatus === 'ACTIVE'

  // Sem plano ativo - Tela de escolha de plano
  if (!isPlanActive) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Crown className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Escolha seu Plano</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          Assine um plano para ter acesso a descontos exclusivos em centenas de parceiros.
        </p>
        <Button size="lg" className="px-8" asChild>
          <Link href="/app/planos">
            Ver Planos Disponíveis
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>

        {/* Preview de benefícios */}
        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-primary">500+</div>
            <div className="text-sm text-muted-foreground">Parceiros</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">50%</div>
            <div className="text-sm text-muted-foreground">Desconto máx.</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">5%</div>
            <div className="text-sm text-muted-foreground">Cashback</div>
          </div>
        </div>

        {/* Planos disponíveis */}
        {data?.planosDisponiveis && data.planosDisponiveis.length > 0 && (
          <div className="mt-12 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Planos Disponíveis</h2>
            <div className="space-y-3">
              {data.planosDisponiveis.map((plan, index) => (
                <Card
                  key={plan.id}
                  className={index === 0 ? 'border-primary border-2' : ''}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          {index === 0 ? <Crown className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="font-semibold">{plan.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {plan.planBenefits.length} benefícios
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(plan.price)}</div>
                        <div className="text-xs text-muted-foreground">/mês</div>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-3"
                      variant={index === 0 ? 'default' : 'outline'}
                      asChild
                    >
                      <Link href={`/checkout?plano=${plan.id}`}>
                        Assinar
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const { assinante, categorias } = data!

  return (
    <div className="space-y-4">
      {/* Header Simples */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Olá, <span className="font-medium text-foreground">{assinante.name?.split(' ')[0] || 'Assinante'}</span> 👋
        </p>
        <p className="text-sm text-muted-foreground">
          {filteredParceiros.length} parceiro{filteredParceiros.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar parceiros, categorias..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 rounded-xl bg-background"
        />
      </div>

      {/* Categorias com scroll horizontal */}
      {categorias && categorias.length > 0 && (
        <div className="-mx-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 px-4 pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl min-w-[72px] transition-all ${
                  selectedCategory === null
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <LayoutGrid className="h-5 w-5" />
                <span className="text-xs font-medium">Todos</span>
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl min-w-[72px] transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {categoryIcons[cat] || <Store className="h-5 w-5" />}
                  <span className="text-xs font-medium truncate max-w-[60px]">{cat}</span>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Lista de Parceiros */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {selectedCategory ? selectedCategory : 'Parceiros Disponíveis'}
          </h2>
          <Link href="/app/parceiros" className="text-sm text-primary flex items-center">
            Ver todos
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {filteredParceiros.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory
                  ? 'Nenhum parceiro encontrado'
                  : 'Nenhum parceiro disponível ainda'
                }
              </p>
              {(searchQuery || selectedCategory) && (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory(null)
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredParceiros.map((parceiro) => (
              <Link key={parceiro.id} href={`/app/parceiros/${parceiro.id}`}>
                <Card className="hover:shadow-md transition-all hover:border-primary/30">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-14 w-14 rounded-xl">
                      <AvatarImage src={parceiro.logo || undefined} />
                      <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold">
                        {(parceiro.tradeName || parceiro.companyName)?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {parceiro.tradeName || parceiro.companyName}
                        </h3>
                        {parceiro.avaliacoes && parceiro.avaliacoes.total > 0 && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{parceiro.avaliacoes.media.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {parceiro.category}
                        {parceiro.city?.name && ` • ${parceiro.city.name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {parceiro.benefits?.length || 0} {(parceiro.benefits?.length || 0) === 1 ? 'oferta' : 'ofertas'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
