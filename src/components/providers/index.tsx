'use client'

import { ReactNode } from 'react'
import { SessionProvider } from './session-provider'
import { ThemeProvider } from './theme-provider'
import { PushProvider } from '@/components/push'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <PushProvider>
          {children}
        </PushProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}

