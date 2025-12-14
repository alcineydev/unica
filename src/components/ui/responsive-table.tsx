'use client'

import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => ReactNode
  hideOnMobile?: boolean
  className?: string
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  onRowClick?: (item: T) => void
  mobileCard?: (item: T) => ReactNode
  emptyMessage?: string
  emptyIcon?: ReactNode
}

export function ResponsiveTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  mobileCard,
  emptyMessage = 'Nenhum item encontrado',
  emptyIcon
}: ResponsiveTableProps<T>) {
  
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyIcon && <div className="mb-2">{emptyIcon}</div>}
        {emptyMessage}
      </div>
    )
  }

  return (
    <>
      {/* Mobile: Cards */}
      <div className="lg:hidden space-y-3">
        {data.map((item) => (
          <Card 
            key={keyExtractor(item)}
            className={cn(
              "overflow-hidden",
              onRowClick && "cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
            )}
            onClick={() => onRowClick?.(item)}
          >
            <CardContent className="p-4">
              {mobileCard ? (
                mobileCard(item)
              ) : (
                <div className="space-y-2">
                  {columns.map((col) => (
                    <div key={col.key} className="flex justify-between items-start gap-2">
                      <span className="text-sm text-muted-foreground">{col.label}</span>
                      <span className="text-sm font-medium text-right">
                        {col.render ? col.render(item) : String(item[col.key] ?? '-')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden lg:block rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columns.filter(c => !c.hideOnMobile).map((col) => (
                <th 
                  key={col.key}
                  className={cn(
                    "text-left text-sm font-medium text-muted-foreground px-4 py-3",
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((item) => (
              <tr 
                key={keyExtractor(item)}
                className={cn(
                  "bg-background",
                  onRowClick && "cursor-pointer hover:bg-muted/50 transition-colors"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.filter(c => !c.hideOnMobile).map((col) => (
                  <td key={col.key} className={cn("px-4 py-3", col.className)}>
                    {col.render ? col.render(item) : String(item[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

