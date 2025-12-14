'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ParceiroSidebar } from '@/components/parceiro'
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
    <div className="min-h-screen bg-muted/30">
      <ParceiroSidebar />
      
      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
