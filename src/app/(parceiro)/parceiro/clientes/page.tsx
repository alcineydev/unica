'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Search,
  MessageCircle,
  Phone,
  DollarSign,
  ShoppingCart,
  Loader2,
  ChevronDown,
  Mail
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { StatsCard } from '@/components/parceiro/stats-card'

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

const sortLabels: Record<SortOption, string> = {
  'recente': 'Mais Recente',
  'antigo': 'Mais Antigo',
  'az': 'Nome (A-Z)',
  'za': 'Nome (Z-A)',
  'maior-valor': 'Maior Valor',
  'menor-valor': 'Menor Valor'
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recente')
  const [showSortDropdown, setShowSortDropdown] = useState(false)

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-500">Carregando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
        <p className="text-slate-500">Clientes que fizeram compras no seu estabelecimento</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Clientes"
          value={clientes.length}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Total Vendas"
          value={formatCurrency(clientes.reduce((sum, c) => sum + c.valorTotal, 0))}
          icon={DollarSign}
          color="emerald"
        />
        <StatsCard
          title="Total Compras"
          value={clientes.reduce((sum, c) => sum + c.totalCompras, 0)}
          icon={ShoppingCart}
          color="purple"
        />
        <StatsCard
          title="Com WhatsApp"
          value={clientes.filter(c => c.phone).length}
          icon={MessageCircle}
          color="amber"
        />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Ordenação */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="w-full sm:w-[200px] flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm hover:bg-slate-100 transition-colors"
            >
              <span className="text-slate-700">{sortLabels[sortBy]}</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {showSortDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-full sm:w-[200px] bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
                  {(Object.entries(sortLabels) as [SortOption, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => {
                        setSortBy(value)
                        setShowSortDropdown(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
                        sortBy === value ? 'text-emerald-600 bg-emerald-50' : 'text-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      {filteredClientes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          {clientes.length === 0 ? (
            <>
              <h3 className="font-semibold text-slate-900 mb-2">Nenhum cliente ainda</h3>
              <p className="text-slate-500">
                Os clientes aparecerão aqui após fazerem compras
              </p>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-slate-900 mb-2">Nenhum resultado</h3>
              <p className="text-slate-500">
                Tente buscar com outros termos
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClientes.map((cliente) => (
            <div
              key={cliente.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Avatar e Info Principal */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-600 font-semibold text-lg">
                      {cliente.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{cliente.nome}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{cliente.email}</span>
                    </div>
                    {cliente.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{cliente.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 sm:gap-8 pl-16 sm:pl-0">
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600">{cliente.totalCompras}</p>
                    <p className="text-xs text-slate-500">Compras</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(cliente.valorTotal)}</p>
                    <p className="text-xs text-slate-500">Total</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-medium text-slate-700">{formatDate(cliente.ultimaCompra)}</p>
                    <p className="text-xs text-slate-500">Última compra</p>
                  </div>
                </div>

                {/* Ação WhatsApp */}
                <button
                  onClick={() => enviarMensagem(cliente)}
                  disabled={!cliente.phone}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-sm font-medium hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contador de resultados */}
      {filteredClientes.length > 0 && (
        <p className="text-sm text-slate-500 text-center">
          Mostrando {filteredClientes.length} de {clientes.length} clientes
        </p>
      )}
    </div>
  )
}
