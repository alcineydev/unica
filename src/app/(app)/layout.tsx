import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { BottomNav, AppHeader } from '@/components/app'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session || session.user.role !== 'ASSINANTE') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

