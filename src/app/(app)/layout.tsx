import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { BottomNav, AppHeader, AppSidebar } from '@/components/app'
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <AppHeader />

      {/* Container com Sidebar + Conteúdo */}
      <div className="flex">
        {/* Sidebar - apenas desktop (lg+) */}
        <AppSidebar />

        {/* Conteúdo Principal */}
        <main className="flex-1 w-full">
          <div className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Nav - apenas mobile/tablet (< lg) */}
      <BottomNav />
    </div>
  )
}
