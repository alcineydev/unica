import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Store, 
  CreditCard, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard',
}

// Dados mockados para o dashboard (serão substituídos por dados reais)
const stats = [
  {
    title: 'Total de Assinantes',
    value: '1.234',
    change: '+12%',
    trend: 'up',
    icon: Users,
    description: 'vs. mês anterior',
  },
  {
    title: 'Parceiros Ativos',
    value: '89',
    change: '+5%',
    trend: 'up',
    icon: Store,
    description: 'vs. mês anterior',
  },
  {
    title: 'Receita Mensal',
    value: 'R$ 45.231',
    change: '+18%',
    trend: 'up',
    icon: CreditCard,
    description: 'vs. mês anterior',
  },
  {
    title: 'Taxa de Conversão',
    value: '24%',
    change: '-2%',
    trend: 'down',
    icon: TrendingUp,
    description: 'vs. mês anterior',
  },
]

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema Unica Clube de Benefícios
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span className={stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                  {stat.change}
                </span>
                <span className="ml-1">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Gráfico de Vendas */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Vendas por Período</CardTitle>
            <CardDescription>
              Resumo das vendas nos últimos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Gráfico de vendas será implementado em breve
            </div>
          </CardContent>
        </Card>

        {/* Atividades Recentes */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Últimas ações no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Novo assinante cadastrado', time: 'há 5 min', user: 'João Silva' },
                { action: 'Venda registrada', time: 'há 15 min', user: 'Restaurante Central' },
                { action: 'Parceiro aprovado', time: 'há 1 hora', user: 'Academia Fit' },
                { action: 'Plano alterado', time: 'há 2 horas', user: 'Maria Santos' },
                { action: 'Nova cidade cadastrada', time: 'há 3 horas', user: 'Admin' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesse rapidamente as funcionalidades mais usadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <QuickActionCard
              title="Novo Assinante"
              description="Cadastrar manualmente"
              href="/admin/assinantes/novo"
            />
            <QuickActionCard
              title="Novo Parceiro"
              description="Adicionar empresa"
              href="/admin/parceiros/novo"
            />
            <QuickActionCard
              title="Novo Benefício"
              description="Criar benefício"
              href="/admin/beneficios/novo"
            />
            <QuickActionCard
              title="Novo Plano"
              description="Criar plano"
              href="/admin/planos/novo"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function QuickActionCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center rounded-lg border bg-card p-4 text-center transition-colors hover:bg-muted"
    >
      <p className="font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </a>
  )
}

