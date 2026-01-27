import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminLayoutClient } from '@/components/admin/admin-layout-client'

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

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
