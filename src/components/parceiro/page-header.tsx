import Link from 'next/link'
import { ChevronRight, LucideIcon, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: Breadcrumb[]
  action?: {
    label: string
    href?: string
    onClick?: () => void
    icon?: LucideIcon
    variant?: 'primary' | 'secondary'
  }
  children?: React.ReactNode
}

export function ParceiroPageHeader({
  title,
  description,
  breadcrumbs,
  action,
  children
}: PageHeaderProps) {
  const ActionIcon = action?.icon || Plus

  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-slate-500 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="w-4 h-4" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-emerald-600 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-900 font-medium">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Title and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {description && (
            <p className="text-slate-500 mt-1">{description}</p>
          )}
        </div>

        {action && (
          action.href ? (
            <Link
              href={action.href}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all",
                action.variant === 'secondary'
                  ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700"
              )}
            >
              <ActionIcon className="w-4 h-4" />
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all",
                action.variant === 'secondary'
                  ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700"
              )}
            >
              <ActionIcon className="w-4 h-4" />
              {action.label}
            </button>
          )
        )}

        {children}
      </div>
    </div>
  )
}
