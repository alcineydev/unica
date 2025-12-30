import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'

export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s | Admin - Unica',
  },
  description: 'Painel Administrativo - Unica Clube de Benefícios',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'DEVELOPER') {
    redirect('/app')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />

      <div className="lg:pl-72">
        <AdminHeader />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
