import { DeveloperSidebar, DeveloperHeader } from '@/components/developer'

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-900">
      <DeveloperSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DeveloperHeader />
        <main className="flex-1 overflow-y-auto bg-zinc-900 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

