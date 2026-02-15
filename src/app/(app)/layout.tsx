import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { BottomNav, AppSidebar, PageTransition } from '@/components/app'
import { UpdateChecker } from '@/components/app/update-checker'
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
      <div className="flex min-h-screen">
        {/* Sidebar: desktop only */}
        <AppSidebar />

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Page transition */}
      <PageTransition />

      {/* Bottom nav: mobile only */}
      <BottomNav />
      <NotificationPermissionModal />
      <UpdateChecker />
      <Toaster position="top-right" richColors />
    </div>
  )
}
