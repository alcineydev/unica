'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { TableLoading } from './loading-spinner'

interface Column<T> {
    key: string
    header: string
    render?: (item: T) => ReactNode
    className?: string
}

interface DataTableProps<T> {
    data: T[]
    columns: Column<T>[]
    loading?: boolean
    loadingText?: string
    emptyIcon?: ReactNode
    emptyText?: string
    emptyDescription?: string
    onRowClick?: (item: T) => void
    className?: string
}

export function DataTable<T extends { id: string }>({
    data,
    columns,
    loading,
    loadingText = 'Carregando...',
    emptyIcon,
    emptyText = 'Nenhum registro encontrado',
    emptyDescription,
    onRowClick,
    className,
}: DataTableProps<T>) {
    if (loading) {
        return <TableLoading text={loadingText} />
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                {emptyIcon && (
                    <div className="mb-4 text-zinc-600">{emptyIcon}</div>
                )}
                <p className="text-lg font-medium text-zinc-400">{emptyText}</p>
                {emptyDescription && (
                    <p className="mt-1 text-sm text-zinc-500">{emptyDescription}</p>
                )}
            </div>
        )
    }

    return (
        <div className={cn('overflow-hidden rounded-lg border border-zinc-700', className)}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-700 bg-zinc-800/50">
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={cn(
                                        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400',
                                        column.className
                                    )}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-700/50">
                        {data.map((item) => (
                            <tr
                                key={item.id}
                                onClick={() => onRowClick?.(item)}
                                className={cn(
                                    'bg-zinc-800/30 transition-colors',
                                    onRowClick && 'cursor-pointer hover:bg-zinc-700/50'
                                )}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={`${item.id}-${column.key}`}
                                        className={cn('px-4 py-3 text-sm text-zinc-300', column.className)}
                                    >
                                        {column.render
                                            ? column.render(item)
                                            : (item as Record<string, unknown>)[column.key]?.toString() || '-'
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
