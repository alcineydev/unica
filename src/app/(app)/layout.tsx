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
      {/* Header: mobile only */}
      <AppHeader />

      <div className="flex min-h-screen">
        {/* Sidebar: desktop only, full viewport height */}
        <AppSidebar />

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          {/* Desktop: padding interno, sem max-w restritivo */}
          {/* Mobile: padding para bottom nav */}
          <div className="lg:px-8 lg:py-6 px-4 py-4">
            <div className="max-w-5xl">
              {children}
            </div>
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
