import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin | Unica',
  description: 'Painel Administrativo - Unica Clube de Benefícios',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Adicionar verificação de role ADMIN via middleware
  return (
    <div className="min-h-screen bg-background">
      {/* TODO: Sidebar do Admin */}
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}

