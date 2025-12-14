'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  Loader2,
  TrendingUp,
  TrendingDown,
  Gift,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RelatorioStats {
  validacoesHoje: number
  validacoesSemana: number
  validacoesMes: number
  crescimento: number
  topBeneficios: { name: string; count: number }[]
  validacoesPorDia: { date: string; count: number }[]
}

export default function ParceiroRelatoriosPage() {
  const [stats, setStats] = useState<RelatorioStats | null>(null)
  const [periodo, setPeriodo] = useState('mes')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRelatorios()
  }, [periodo])

  const fetchRelatorios = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/parceiro/relatorios?periodo=${periodo}`)
      const data = await response.json()
      
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calcular máximo para o gráfico
  const maxValidacoes = stats?.validacoesPorDia 
    ? Math.max(...stats.validacoesPorDia.map(d => d.count), 1)
    : 1

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
          <h1 className="text-xl md:text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">
            Estatísticas e métricas do seu negócio
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Última Semana</SelectItem>
              <SelectItem value="mes">Último Mês</SelectItem>
              <SelectItem value="trimestre">Último Trimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Hoje</p>
                <p className="text-xl md:text-2xl font-bold">{stats?.validacoesHoje || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Gift className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Semana</p>
                <p className="text-xl md:text-2xl font-bold">{stats?.validacoesSemana || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Mês</p>
                <p className="text-xl md:text-2xl font-bold">{stats?.validacoesMes || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Crescimento</p>
                <div className={cn(
                  "flex items-center gap-1 text-xl md:text-2xl font-bold",
                  (stats?.crescimento || 0) >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {(stats?.crescimento || 0) >= 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                  {stats?.crescimento || 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Validações por Dia</CardTitle>
          <CardDescription>Histórico de benefícios validados</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          {stats?.validacoesPorDia && stats.validacoesPorDia.length > 0 ? (
            <div className="h-48 md:h-64">
              <div className="flex items-end justify-between h-40 md:h-52 gap-1">
                {stats.validacoesPorDia.map((data, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t relative group"
                    style={{
                      height: `${(data.count / maxValidacoes) * 100}%`,
                      minHeight: data.count > 0 ? '4px' : '0'
                    }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {new Date(data.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      <br />
                      {data.count} validação(ões)
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{stats.validacoesPorDia[0]?.date ? new Date(stats.validacoesPorDia[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}</span>
                <span>{stats.validacoesPorDia[stats.validacoesPorDia.length - 1]?.date ? new Date(stats.validacoesPorDia[stats.validacoesPorDia.length - 1].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}</span>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Benefícios */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Benefícios Mais Usados</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          {stats?.topBeneficios && stats.topBeneficios.length > 0 ? (
            <div className="space-y-3">
              {stats.topBeneficios.map((beneficio, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{beneficio.name}</p>
                    <div className="h-2 bg-muted rounded-full mt-1">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ 
                          width: `${(beneficio.count / (stats.topBeneficios[0]?.count || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium">{beneficio.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Nenhum benefício utilizado ainda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

