'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Users, 
  Search, 
  Loader2,
  Calendar,
  Gift,
  TrendingUp
} from 'lucide-react'

interface Cliente {
  id: string
  name: string
  email: string
  avatar?: string
  totalVisitas: number
  ultimaVisita: string
  beneficiosUsados: number
}

export default function ParceiroClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/parceiro/clientes')
      const data = await response.json()
      
      if (data.clientes) {
        setClientes(data.clientes)
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredClientes = clientes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Assinantes que utilizaram seus benefícios
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-3">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg md:text-xl font-bold">{clientes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Gift className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Usos</p>
                <p className="text-lg md:text-xl font-bold">
                  {clientes.reduce((acc, c) => acc + c.beneficiosUsados, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recorrentes</p>
                <p className="text-lg md:text-xl font-bold">
                  {clientes.filter(c => c.totalVisitas > 1).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista */}
      {filteredClientes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {clientes.length === 0 
                ? 'Nenhum cliente utilizou seus benefícios ainda'
                : 'Nenhum cliente encontrado'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="lg:hidden space-y-3">
            {filteredClientes.map((cliente) => (
              <Card key={cliente.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      src={cliente.avatar}
                      name={cliente.name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{cliente.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{cliente.email}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Gift className="h-3 w-3" />
                          {cliente.beneficiosUsados} usos
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(cliente.ultimaVisita)}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {cliente.totalVisitas}x
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden lg:block rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Visitas</TableHead>
                  <TableHead>Benefícios Usados</TableHead>
                  <TableHead>Última Visita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={cliente.avatar}
                          name={cliente.name}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium">{cliente.name}</p>
                          <p className="text-sm text-muted-foreground">{cliente.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{cliente.totalVisitas}x</Badge>
                    </TableCell>
                    <TableCell>{cliente.beneficiosUsados}</TableCell>
                    <TableCell>{formatDate(cliente.ultimaVisita)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}

