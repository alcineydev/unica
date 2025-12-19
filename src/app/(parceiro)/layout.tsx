'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ParceiroHeader, ParceiroSidebar, ParceiroBottomNav } from '@/components/parceiro'
import { Loader2 } from 'lucide-react'

export default function ParceiroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session && !['DEVELOPER', 'ADMIN', 'PARCEIRO'].includes(session.user.role)) {
      router.push('/app')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session || !['DEVELOPER', 'ADMIN', 'PARCEIRO'].includes(session.user.role)) {
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <ParceiroHeader />
      <div className="flex">
        <ParceiroSidebar />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <ParceiroBottomNav />
    </div>
  )
}
