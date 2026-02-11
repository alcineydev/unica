'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface FilterBarProps {
    search?: {
        value: string
        onChange: (value: string) => void
        placeholder?: string
    }
    filters?: ReactNode
    actions?: ReactNode
    totalResults?: number
    className?: string
}

export function FilterBar({
    search,
    filters,
    actions,
    totalResults,
    className,
}: FilterBarProps) {
    return (
        <div className={cn(
            'flex flex-col gap-4 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4',
            className
        )}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Search */}
                {search && (
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <Input
                            value={search.value}
                            onChange={(e) => search.onChange(e.target.value)}
                            placeholder={search.placeholder || 'Buscar...'}
                            className="pl-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-red-500 focus:ring-red-500/20"
                        />
                        {search.value && (
                            <button
                                onClick={() => search.onChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}

                {/* Actions */}
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>

            {/* Filters */}
            {filters && (
                <div className="flex flex-wrap items-center gap-2">
                    {filters}
                </div>
            )}

            {/* Total Results */}
            {typeof totalResults === 'number' && (
                <div className="text-xs text-zinc-500">
                    {totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    )
}
