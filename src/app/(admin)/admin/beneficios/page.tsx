import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Plus, Gift } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Benefícios',
}

export default function BeneficiosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Benefícios</h1>
          <p className="text-muted-foreground">
            Crie e gerencie os benefícios modulares do sistema
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Benefício
        </Button>
      </div>

      <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed">
        <Gift className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Gerenciamento de Benefícios</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          O CRUD completo de benefícios será implementado em breve.
        </p>
      </div>
    </div>
  )
}

