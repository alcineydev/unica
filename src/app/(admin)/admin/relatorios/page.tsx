import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, PieChart, TrendingUp, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Relatórios',
}

const relatorios = [
  {
    name: 'Vendas por Período',
    description: 'Análise de vendas por dia, semana ou mês',
    icon: BarChart3,
  },
  {
    name: 'Assinantes por Plano',
    description: 'Distribuição de assinantes entre os planos',
    icon: PieChart,
  },
  {
    name: 'Crescimento',
    description: 'Evolução de assinantes e parceiros',
    icon: TrendingUp,
  },
  {
    name: 'Exportar Dados',
    description: 'Exportar relatórios em CSV ou Excel',
    icon: Download,
  },
]

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Visualize métricas e exporte dados do sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {relatorios.map((relatorio) => (
          <Card key={relatorio.name} className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <relatorio.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{relatorio.name}</CardTitle>
                <CardDescription>{relatorio.description}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo do Mês</CardTitle>
          <CardDescription>Principais métricas do mês atual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Gráficos e métricas detalhadas serão implementados em breve.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

