import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, MessageSquare, Mail, Settings } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Integrações',
}

const integracoes = [
  {
    name: 'Mercado Pago',
    description: 'Processamento de pagamentos e assinaturas',
    icon: CreditCard,
    status: 'inactive',
    category: 'Pagamentos',
  },
  {
    name: 'Evolution API',
    description: 'Envio de mensagens via WhatsApp',
    icon: MessageSquare,
    status: 'inactive',
    category: 'Comunicação',
  },
  {
    name: 'Resend',
    description: 'Envio de emails transacionais',
    icon: Mail,
    status: 'inactive',
    category: 'Comunicação',
  },
]

export default function IntegracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground">
          Configure as integrações externas do sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integracoes.map((integracao) => (
          <Card key={integracao.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <integracao.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{integracao.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{integracao.category}</p>
                </div>
              </div>
              <Badge variant={integracao.status === 'active' ? 'default' : 'secondary'}>
                {integracao.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {integracao.description}
              </CardDescription>
              <Button variant="outline" size="sm" className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Configurar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

