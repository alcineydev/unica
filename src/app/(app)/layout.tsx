import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Unica',
  description: 'Unica Clube de Benefícios - Aproveite os melhores descontos',
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Adicionar verificação de role ASSINANTE via middleware
  return (
    <div className="min-h-screen bg-background">
      {/* TODO: Bottom Navigation do App */}
      <main className="pb-20">
        {children}
      </main>
    </div>
  )
}

