'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export function Loading({ 
  size = 'md', 
  text, 
  className,
  fullScreen = false 
}: LoadingProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return content
}

export function LoadingPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <Loading size="lg" text="Carregando..." />
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="flex h-40 items-center justify-center rounded-lg border bg-card">
      <Loading size="md" />
    </div>
  )
}

