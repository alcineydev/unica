'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
    title: string
    description?: string
    icon?: ReactNode
    actions?: ReactNode
    badge?: {
        text: string
        variant?: 'default' | 'success' | 'warning' | 'error'
    }
    className?: string
}

const badgeVariants = {
    default: 'bg-zinc-700 text-zinc-300',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

export function PageHeader({
    title,
    description,
    icon,
    actions,
    badge,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn('mb-6', className)}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
                            {icon}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white">{title}</h1>
                            {badge && (
                                <span className={cn(
                                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                                    badgeVariants[badge.variant || 'default']
                                )}>
                                    {badge.text}
                                </span>
                            )}
                        </div>
                        {description && (
                            <p className="mt-1 text-sm text-zinc-400">{description}</p>
                        )}
                    </div>
                </div>
                {actions && (
                    <div className="flex flex-wrap items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    )
}
