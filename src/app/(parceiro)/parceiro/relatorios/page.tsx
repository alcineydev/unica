'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  Loader2,
  Trophy,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { toast } from 'sonner'

interface Relatorio {
  periodo: string
  totalVendas: number
  valorTotal: number
  ticketMedio: number
  novosClientes: number
  crescimentoVendas: number
  crescimentoValor: number
  vendasPorDia: { data: string; vendas: number; valor: number }[]
  topClientes: { id: string; nome: string; avatar?: string; compras: number; valor: number }[]
}

type PeriodoOption = '7dias' | '30dias' | 'mes' | 'semana'

export default function RelatoriosPage() {
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [periodo, setPeriodo] = useState<PeriodoOption>('30dias')

  useEffect(() => {
    fetchRelatorio()
  }, [periodo])

  const fetchRelatorio = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/parceiro/relatorios?periodo=${periodo}`)
      const data = await response.json()

      if (data.relatorio) {
        setRelatorio(data.relatorio)
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error)
      toast.error('Erro ao carregar relatório')
    } finally {
      setIsLoading(false)
    }
  }

  const exportarCSV = () => {
    if (!relatorio) return

    // Criar conteúdo CSV
    let csv = 'Data,Vendas,Valor\n'
    relatorio.vendasPorDia.forEach(dia => {
      csv += `${dia.data},${dia.vendas},${dia.valor.toFixed(2)}\n`
    })

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio-vendas-${periodo}.csv`
    link.click()

    toast.success('Relatório exportado!')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getPeriodoLabel = () => {
    switch (periodo) {
      case '7dias': return 'Últimos 7 dias'
      case '30dias': return 'Últimos 30 dias'
      case 'mes': return 'Este mês'
      case 'semana': return 'Esta semana'
      default: return ''
    }
  }

  // Calcular altura máxima para o gráfico
  const maxValor = relatorio?.vendasPorDia.reduce((max, d) => Math.max(max, d.valor), 0) || 1

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho do seu negócio</p>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoOption)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7dias">7 dias</SelectItem>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="30dias">30 dias</SelectItem>
              <SelectItem value="mes">Este mês</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportarCSV} size="sm">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Total Vendas</p>
                <p className="text-lg sm:text-2xl font-bold">{relatorio?.totalVendas || 0}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </div>
            {relatorio?.crescimentoVendas !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-[10px] sm:text-xs ${relatorio.crescimentoVendas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {relatorio.crescimentoVendas >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span className="truncate">{Math.abs(relatorio.crescimentoVendas)}% vs anterior</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Faturamento</p>
                <p className="text-sm sm:text-2xl font-bold truncate">
                  {formatCurrency(relatorio?.valorTotal || 0)}
                </p>
              </div>
              <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900 rounded-lg flex-shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
            </div>
            {relatorio?.crescimentoValor !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-[10px] sm:text-xs ${relatorio.crescimentoValor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {relatorio.crescimentoValor >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span className="truncate">{Math.abs(relatorio.crescimentoValor)}% vs anterior</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Ticket Médio</p>
                <p className="text-sm sm:text-2xl font-bold truncate">
                  {formatCurrency(relatorio?.ticketMedio || 0)}
                </p>
              </div>
              <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900 rounded-lg flex-shrink-0">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Novos Clientes</p>
                <p className="text-lg sm:text-2xl font-bold">{relatorio?.novosClientes || 0}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900 rounded-lg flex-shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Gráfico de Vendas */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Vendas por Dia</CardTitle>
            <CardDescription>{getPeriodoLabel()}</CardDescription>
          </CardHeader>
          <CardContent>
            {relatorio?.vendasPorDia && relatorio.vendasPorDia.length > 0 ? (
              <div className="space-y-4">
                {/* Gráfico de Barras Simples */}
                <div className="flex items-end gap-1 h-[180px] sm:h-[200px] overflow-x-auto pb-2">
                  {relatorio.vendasPorDia.map((dia, index) => {
                    const altura = (dia.valor / maxValor) * 100
                    return (
                      <div key={index} className="flex flex-col items-center min-w-[24px] sm:min-w-[30px] flex-1">
                        <div
                          className="w-full bg-primary rounded-t-sm transition-all hover:bg-primary/80 cursor-pointer relative group"
                          style={{ height: `${Math.max(altura, 5)}%` }}
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                            <div className="bg-zinc-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                              {formatCurrency(dia.valor)}
                              <br />
                              {dia.vendas} vendas
                            </div>
                          </div>
                        </div>
                        <span className="text-[8px] sm:text-[10px] text-muted-foreground mt-1 truncate w-full text-center">
                          {dia.data.split('/')[0]}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Legenda */}
                <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Total: {relatorio.totalVendas} vendas</span>
                  <span>{formatCurrency(relatorio.valorTotal)}</span>
                </div>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma venda no período</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Clientes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Clientes
            </CardTitle>
            <CardDescription>Maiores compradores</CardDescription>
          </CardHeader>
          <CardContent>
            {relatorio?.topClientes && relatorio.topClientes.length > 0 ? (
              <div className="space-y-3">
                {relatorio.topClientes.slice(0, 5).map((cliente, index) => (
                  <div key={cliente.id} className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-shrink-0 w-5 sm:w-6 text-center">
                      {index === 0 ? (
                        <span className="text-sm sm:text-base">🥇</span>
                      ) : index === 1 ? (
                        <span className="text-sm sm:text-base">🥈</span>
                      ) : index === 2 ? (
                        <span className="text-sm sm:text-base">🥉</span>
                      ) : (
                        <span className="text-muted-foreground text-xs sm:text-sm">{index + 1}º</span>
                      )}
                    </div>
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                      <AvatarImage src={cliente.avatar} />
                      <AvatarFallback className="text-xs bg-primary/10">
                        {cliente.nome.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{cliente.nome}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{cliente.compras} compras</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs sm:text-sm font-semibold text-green-600 truncate max-w-[70px] sm:max-w-none">
                        {formatCurrency(cliente.valor)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum cliente ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
