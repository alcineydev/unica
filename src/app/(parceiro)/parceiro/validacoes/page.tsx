'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  QrCode, 
  Search, 
  Loader2,
  CheckCircle,
  Calendar,
  User
} from 'lucide-react'

interface Validation {
  id: string
  customerName: string
  customerEmail: string
  benefitName: string
  amount: number
  createdAt: string
}

export default function ParceiroValidacoesPage() {
  const [validations, setValidations] = useState<Validation[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchValidations()
  }, [])

  const fetchValidations = async () => {
    try {
      const response = await fetch('/api/parceiro/validacoes')
      const data = await response.json()
      
      if (data.validations) {
        setValidations(data.validations)
      }
    } catch (error) {
      console.error('Erro ao buscar validações:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredValidations = validations.filter(v =>
    v.customerName.toLowerCase().includes(search.toLowerCase()) ||
    v.benefitName.toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Validações</h1>
          <p className="text-sm text-muted-foreground">Histórico de vendas e validações</p>
        </div>
        <Link href="/parceiro/venda">
          <Button className="w-full sm:w-auto">
            <QrCode className="mr-2 h-4 w-4" />
            Nova Venda
          </Button>
        </Link>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista */}
      {filteredValidations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {search ? 'Nenhuma validação encontrada' : 'Nenhuma venda realizada ainda'}
            </p>
            {!search && (
              <Link href="/parceiro/venda">
                <Button variant="link" className="mt-2">
                  Registrar primeira venda
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="lg:hidden space-y-3">
            {filteredValidations.map((validation) => (
              <Card key={validation.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-green-100 flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{validation.customerName}</p>
                        <span className="text-green-600 font-semibold flex-shrink-0">
                          {formatCurrency(validation.amount)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{validation.customerEmail}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {validation.benefitName}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(validation.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
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
                  <TableHead>Benefício</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredValidations.map((validation) => (
                  <TableRow key={validation.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{validation.customerName}</p>
                          <p className="text-sm text-muted-foreground">{validation.customerEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{validation.benefitName}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(validation.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(validation.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 border-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Validado
                      </Badge>
                    </TableCell>
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

