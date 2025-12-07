import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Plus, CreditCard } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Planos',
}

export default function PlanosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planos</h1>
          <p className="text-muted-foreground">
            Crie planos combinando benefícios e definindo preços
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed">
        <CreditCard className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Gerenciamento de Planos</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          O CRUD completo de planos será implementado em breve.
        </p>
      </div>
    </div>
  )
}

