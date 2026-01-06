import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { BottomNav, DesktopSidebar } from '@/components/app'
import { NotificationPermissionModal } from '@/components/app/notification-permission-modal'
import { Toaster } from 'sonner'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Verificar se é assinante ou roles permitidas
  const allowedRoles = ['ASSINANTE', 'DEVELOPER', 'ADMIN']
  if (!allowedRoles.includes(session.user.role as string)) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors />

      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav />

      {/* Modal de Permissão de Notificações */}
      <NotificationPermissionModal />
    </div>
  )
}
