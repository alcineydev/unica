import { Metadata } from 'next'
import { PageHeader } from '@/components/shared'

export const metadata: Metadata = {
  title: 'Dashboard Parceiro | Unica',
}

export default function ParceiroDashboardPage() {
  return (
    <div>
      <PageHeader 
        title="Painel do Parceiro" 
        description="Gerencie suas vendas e acompanhe suas métricas"
      />
      <p className="text-muted-foreground">
        Dashboard do parceiro será implementado em breve.
      </p>
    </div>
  )
}

