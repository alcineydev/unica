import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DeveloperSidebar } from '@/components/developer/sidebar'
import { DeveloperHeader } from '@/components/developer/header'

export default async function DeveloperLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'DEVELOPER') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <DeveloperSidebar />
      
      <div className="lg:pl-72">
        <DeveloperHeader />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}