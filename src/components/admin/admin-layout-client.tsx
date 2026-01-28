'use client'

import { type ReactNode } from 'react'
import { SidebarProvider, useSidebar } from '@/contexts/sidebar-context'
import { ConfigProvider } from '@/contexts/config-context'
import { AdminSidebar } from './sidebar'
import { AdminHeader } from './header'
import { cn } from '@/lib/utils'

function LayoutContent({ children }: { children: ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />
      <div
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        <AdminHeader />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export function AdminLayoutClient({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider>
      <SidebarProvider>
        <LayoutContent>{children}</LayoutContent>
      </SidebarProvider>
    </ConfigProvider>
  )
}
