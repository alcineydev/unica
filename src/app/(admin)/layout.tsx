import { Metadata } from 'next'
import { AdminSidebar, AdminHeader } from '@/components/admin'

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
      <div className="pl-[250px] transition-all duration-300">
        <AdminHeader />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

