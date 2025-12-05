import { Metadata } from 'next'
import { PageHeader } from '@/components/shared'

export const metadata: Metadata = {
  title: 'Dashboard Developer | Unica',
}

export default function DeveloperDashboardPage() {
  return (
    <div>
      <PageHeader 
        title="Painel Developer" 
        description="Gerenciamento técnico do sistema"
      />
      <p className="text-muted-foreground">
        Dashboard do developer será implementado em breve.
      </p>
    </div>
  )
}

