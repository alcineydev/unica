import { Metadata } from 'next'
import { AdminSidebar } from '@/components/admin'

export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s | Admin - Unica',
  },
  description: 'Painel Administrativo - Unica Clube de Benefícios',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar />
      
      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0 transition-all duration-300">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
