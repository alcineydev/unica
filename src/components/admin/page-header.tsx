import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
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
    icon?: React.ReactNode
    variant?: 'primary' | 'secondary' | 'success'
  }
  children?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  action,
  children
}: PageHeaderProps) {
  const getButtonStyles = (variant: string = 'primary') => {
    switch (variant) {
      case 'success':
        return 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800'
      case 'secondary':
        return 'bg-slate-600 hover:bg-slate-700'
      default:
        return 'bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800'
    }
  }

  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-slate-500 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="w-4 h-4" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-brand-600 transition-colors">
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
                "inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all",
                getButtonStyles(action.variant)
              )}
            >
              {action.icon || <Plus className="w-4 h-4" />}
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all",
                getButtonStyles(action.variant)
              )}
            >
              {action.icon || <Plus className="w-4 h-4" />}
              {action.label}
            </button>
          )
        )}

        {children}
      </div>
    </div>
  )
}
