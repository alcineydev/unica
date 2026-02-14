import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { BottomNav, AppHeader, AppSidebar } from '@/components/app'
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
    <div className="min-h-screen bg-[#f8fafc]">
      <AppHeader />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 min-h-[calc(100vh-64px)] pb-20 lg:pb-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
      <NotificationPermissionModal />
      <Toaster position="top-right" richColors />
    </div>
  )
}
