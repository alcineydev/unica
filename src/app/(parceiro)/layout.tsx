import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ParceiroSidebar, ParceiroHeader } from '@/components/parceiro'

export default async function ParceiroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session || session.user.role !== 'PARCEIRO') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <ParceiroSidebar />
      <div className="ml-[250px]">
        <ParceiroHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}

