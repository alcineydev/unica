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

  const allowedRoles = ['ASSINANTE', 'DEVELOPER', 'ADMIN']
  if (!allowedRoles.includes(session.user.role as string)) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header: desktop only */}
      <AppHeader />

      <div className="flex">
        {/* Sidebar: desktop only */}
        <AppSidebar />

        {/* Main */}
        <main className="flex-1 min-h-screen lg:min-h-[calc(100vh-64px)] pb-20 lg:pb-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom nav: mobile only */}
      <BottomNav />
      <NotificationPermissionModal />
      <Toaster position="top-right" richColors />
    </div>
  )
}
