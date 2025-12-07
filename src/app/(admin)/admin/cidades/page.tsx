import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Plus, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cidades',
}

export default function CidadesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cidades</h1>
          <p className="text-muted-foreground">
            Gerencie as cidades onde o Unica está disponível
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Cidade
        </Button>
      </div>

      <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed">
        <MapPin className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Gerenciamento de Cidades</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          O CRUD completo de cidades será implementado em breve.
        </p>
      </div>
    </div>
  )
}

