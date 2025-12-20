'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Search,
  MessageCircle,
  Phone,
  DollarSign,
  ShoppingCart,
  Loader2,
  SlidersHorizontal
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Cliente {
  id: string
  nome: string
  email: string
  avatar?: string
  phone: string
  cpf: string
  totalCompras: number
  valorTotal: number
  ultimaCompra?: string
  plano?: string
}

type SortOption = 'recente' | 'antigo' | 'az' | 'za' | 'maior-valor' | 'menor-valor'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recente')

  useEffect(() => {
    fetchClientes()
  }, [])

  useEffect(() => {
    filterAndSortClientes()
  }, [clientes, searchQuery, sortBy])

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/parceiro/clientes')
      const data = await response.json()

      if (data.clientes) {
        setClientes(data.clientes)
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      toast.error('Erro ao carregar clientes')
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortClientes = () => {
    let result = [...clientes]

    // Filtrar por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(c =>
        c.nome.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone?.includes(query)
      )
    }

    // Ordenar
    switch (sortBy) {
      case 'recente':
        result.sort((a, b) => {
          if (!a.ultimaCompra) return 1
          if (!b.ultimaCompra) return -1
          return new Date(b.ultimaCompra).getTime() - new Date(a.ultimaCompra).getTime()
        })
        break
      case 'antigo':
        result.sort((a, b) => {
          if (!a.ultimaCompra) return 1
          if (!b.ultimaCompra) return -1
          return new Date(a.ultimaCompra).getTime() - new Date(b.ultimaCompra).getTime()
        })
        break
      case 'az':
        result.sort((a, b) => a.nome.localeCompare(b.nome))
        break
      case 'za':
        result.sort((a, b) => b.nome.localeCompare(a.nome))
        break
      case 'maior-valor':
        result.sort((a, b) => b.valorTotal - a.valorTotal)
        break
      case 'menor-valor':
        result.sort((a, b) => a.valorTotal - b.valorTotal)
        break
    }

    setFilteredClientes(result)
  }

  const enviarMensagem = (cliente: Cliente) => {
    if (!cliente.phone) {
      toast.error('Cliente não possui telefone cadastrado')
      return
    }

    // Limpar telefone e formatar para WhatsApp
    const phoneClean = cliente.phone.replace(/\D/g, '')
    const phoneWithCountry = phoneClean.startsWith('55') ? phoneClean : `55${phoneClean}`

    // Mensagem padrão
    const mensagem = encodeURIComponent(
      `Olá ${cliente.nome.split(' ')[0]}! 👋\n\nTemos uma promoção especial para você! Venha conferir.`
    )

    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${mensagem}`
    window.open(whatsappUrl, '_blank')
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca'
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return 'Data inválida'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">
          Clientes que fizeram compras no seu estabelecimento
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clientes.length}</p>
                <p className="text-xs text-muted-foreground">Total de Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(clientes.reduce((sum, c) => sum + c.valorTotal, 0))}
                </p>
                <p className="text-xs text-muted-foreground">Total em Vendas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {clientes.reduce((sum, c) => sum + c.totalCompras, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total de Compras</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <MessageCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {clientes.filter(c => c.phone).length}
                </p>
                <p className="text-xs text-muted-foreground">Com WhatsApp</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Ordenação */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recente">Mais Recente</SelectItem>
                <SelectItem value="antigo">Mais Antigo</SelectItem>
                <SelectItem value="az">Nome (A-Z)</SelectItem>
                <SelectItem value="za">Nome (Z-A)</SelectItem>
                <SelectItem value="maior-valor">Maior Valor</SelectItem>
                <SelectItem value="menor-valor">Menor Valor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      {filteredClientes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            {clientes.length === 0 ? (
              <>
                <h3 className="font-semibold mb-2">Nenhum cliente ainda</h3>
                <p className="text-muted-foreground">
                  Os clientes aparecerão aqui após fazerem compras
                </p>
              </>
            ) : (
              <>
                <h3 className="font-semibold mb-2">Nenhum resultado</h3>
                <p className="text-muted-foreground">
                  Tente buscar com outros termos
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredClientes.map((cliente) => (
            <Card key={cliente.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Avatar e Info Principal */}
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={cliente.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {cliente.nome.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{cliente.nome}</h3>
                      <p className="text-sm text-muted-foreground truncate">{cliente.email}</p>
                      {cliente.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {cliente.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 sm:gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">{cliente.totalCompras}</p>
                      <p className="text-xs text-muted-foreground">Compras</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(cliente.valorTotal)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{formatDate(cliente.ultimaCompra)}</p>
                      <p className="text-xs text-muted-foreground">Última Compra</p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 sm:flex-col">
                    <Button
                      onClick={() => enviarMensagem(cliente)}
                      className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                      disabled={!cliente.phone}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      <span className="sm:hidden md:inline">Enviar Mensagem</span>
                      <span className="hidden sm:inline md:hidden">WhatsApp</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Contador de resultados */}
      {filteredClientes.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Mostrando {filteredClientes.length} de {clientes.length} clientes
        </p>
      )}
    </div>
  )
}
