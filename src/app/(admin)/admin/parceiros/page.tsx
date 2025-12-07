import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Plus, Store } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Parceiros',
}

export default function ParceirosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parceiros</h1>
          <p className="text-muted-foreground">
            Gerencie as empresas parceiras do clube
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Parceiro
        </Button>
      </div>

      <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed">
        <Store className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Gerenciamento de Parceiros</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          O CRUD completo de parceiros será implementado em breve.
        </p>
      </div>
    </div>
  )
}

