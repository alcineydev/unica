import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Developer | Unica',
  description: 'Painel do Desenvolvedor - Unica Clube de Benefícios',
}

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Adicionar verificação de role DEVELOPER via middleware
  return (
    <div className="min-h-screen bg-background">
      {/* TODO: Sidebar do Developer */}
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}

