'use client'

import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    onPageChange: (page: number) => void
    className?: string
}

export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    className,
}: PaginationProps) {
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

    const canGoPrev = currentPage > 1
    const canGoNext = currentPage < totalPages

    // Gerar array de páginas para exibir
    const getPageNumbers = () => {
        const pages: (number | string)[] = []
        const maxVisible = 5

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i)
                pages.push('...')
                pages.push(totalPages)
            } else if (currentPage >= totalPages - 2) {
                pages.push(1)
                pages.push('...')
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
            } else {
                pages.push(1)
                pages.push('...')
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
                pages.push('...')
                pages.push(totalPages)
            }
        }

        return pages
    }

    return (
        <div className={cn(
            'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
            className
        )}>
            {/* Info */}
            <p className="text-sm text-zinc-400">
                Mostrando <span className="font-medium text-zinc-300">{startItem}</span> a{' '}
                <span className="font-medium text-zinc-300">{endItem}</span> de{' '}
                <span className="font-medium text-zinc-300">{totalItems}</span> registros
            </p>

            {/* Controls */}
            <div className="flex items-center gap-1">
                {/* First */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(1)}
                    disabled={!canGoPrev}
                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>

                {/* Prev */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!canGoPrev}
                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 mx-2">
                    {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                            <span key={`ellipsis-${index}`} className="px-2 text-zinc-500">...</span>
                        ) : (
                            <Button
                                key={page}
                                variant="ghost"
                                size="icon"
                                onClick={() => onPageChange(page as number)}
                                className={cn(
                                    'h-8 w-8 text-sm font-medium',
                                    currentPage === page
                                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                )}
                            >
                                {page}
                            </Button>
                        )
                    ))}
                </div>

                {/* Next */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!canGoNext}
                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Last */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(totalPages)}
                    disabled={!canGoNext}
                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
