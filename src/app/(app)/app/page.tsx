import { Metadata } from 'next'
import { PageHeader } from '@/components/shared'

export const metadata: Metadata = {
  title: 'Home | Unica',
}

export default function AppHomePage() {
  return (
    <div className="p-4">
      <PageHeader 
        title="Bem-vindo ao Unica" 
        description="Encontre os melhores parceiros e aproveite seus benefícios"
      />
      <p className="text-muted-foreground">
        App do assinante será implementado em breve.
      </p>
    </div>
  )
}

