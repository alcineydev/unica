import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  color?: 'emerald' | 'blue' | 'amber' | 'purple'
}

const colorStyles = {
  emerald: {
    bg: 'bg-emerald-100',
    icon: 'text-emerald-600',
  },
  blue: {
    bg: 'bg-blue-100',
    icon: 'text-blue-600',
  },
  amber: {
    bg: 'bg-amber-100',
    icon: 'text-amber-600',
  },
  purple: {
    bg: 'bg-purple-100',
    icon: 'text-purple-600',
  },
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'emerald'
}: StatsCardProps) {
  const styles = colorStyles[color]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-emerald-600" : "text-red-600"
              )}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs text-slate-400">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", styles.bg)}>
          <Icon className={cn("w-6 h-6", styles.icon)} />
        </div>
      </div>
    </div>
  )
}
