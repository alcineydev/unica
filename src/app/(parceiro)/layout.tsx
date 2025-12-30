'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ParceiroHeader } from '@/components/parceiro/header'
import { ParceiroSidebar } from '@/components/parceiro/sidebar'
import { ParceiroBottomNav } from '@/components/parceiro/parceiro-bottom-nav'
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!session || !['DEVELOPER', 'ADMIN', 'PARCEIRO'].includes(session.user.role)) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ParceiroSidebar />

      <div className="lg:pl-72">
        <ParceiroHeader />

        <main className="p-6 pb-20 lg:pb-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <ParceiroBottomNav />
    </div>
  )
}
