import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { BottomNav } from '@/components/app'

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
    <div className="min-h-screen bg-background pb-20">
      {children}
      <BottomNav />
    </div>
  )
}

