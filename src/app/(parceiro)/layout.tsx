import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Parceiro | Unica',
  description: 'Painel do Parceiro - Unica Clube de Benefícios',
}

export default function ParceiroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Adicionar verificação de role PARCEIRO via middleware
  return (
    <div className="min-h-screen bg-background">
      {/* TODO: Sidebar/Navigation do Parceiro */}
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}

