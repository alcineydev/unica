import { Metadata } from 'next'
import { PageHeader } from '@/components/shared'

export const metadata: Metadata = {
  title: 'Dashboard Admin | Unica',
}

export default function AdminDashboardPage() {
  return (
    <div>
      <PageHeader 
        title="Painel Administrativo" 
        description="Gerencie todo o sistema Unica"
      />
      <p className="text-muted-foreground">
        Dashboard do admin será implementado em breve.
      </p>
    </div>
  )
}

