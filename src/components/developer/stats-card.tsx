'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
    title: string
    value: string | number
    icon: ReactNode
    description?: string
    trend?: {
        value: number
        label: string
    }
    color?: 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'cyan'
    className?: string
}

const colorClasses = {
    red: {
        bg: 'from-red-500/20 to-red-600/10',
        icon: 'bg-red-500/20 text-red-400',
        border: 'border-red-500/30',
        glow: 'shadow-red-500/10',
    },
    blue: {
        bg: 'from-blue-500/20 to-blue-600/10',
        icon: 'bg-blue-500/20 text-blue-400',
        border: 'border-blue-500/30',
        glow: 'shadow-blue-500/10',
    },
    green: {
        bg: 'from-green-500/20 to-green-600/10',
        icon: 'bg-green-500/20 text-green-400',
        border: 'border-green-500/30',
        glow: 'shadow-green-500/10',
    },
    amber: {
        bg: 'from-amber-500/20 to-amber-600/10',
        icon: 'bg-amber-500/20 text-amber-400',
        border: 'border-amber-500/30',
        glow: 'shadow-amber-500/10',
    },
    purple: {
        bg: 'from-purple-500/20 to-purple-600/10',
        icon: 'bg-purple-500/20 text-purple-400',
        border: 'border-purple-500/30',
        glow: 'shadow-purple-500/10',
    },
    cyan: {
        bg: 'from-cyan-500/20 to-cyan-600/10',
        icon: 'bg-cyan-500/20 text-cyan-400',
        border: 'border-cyan-500/30',
        glow: 'shadow-cyan-500/10',
    },
}

export function StatsCard({
    title,
    value,
    icon,
    description,
    trend,
    color = 'red',
    className,
}: StatsCardProps) {
    const colors = colorClasses[color]

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-xl border bg-gradient-to-br p-5',
                'bg-zinc-800/50 backdrop-blur-sm',
                'transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
                colors.border,
                colors.glow,
                className
            )}
        >
            {/* Background gradient */}
            <div className={cn(
                'absolute inset-0 bg-gradient-to-br opacity-50',
                colors.bg
            )} />

            {/* Content */}
            <div className="relative z-10">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-zinc-400">{title}</p>
                        <p className="text-3xl font-bold text-white">{value}</p>
                        {description && (
                            <p className="text-xs text-zinc-500">{description}</p>
                        )}
                    </div>
                    <div className={cn(
                        'rounded-lg p-3',
                        colors.icon
                    )}>
                        {icon}
                    </div>
                </div>

                {/* Trend */}
                {trend && (
                    <div className="mt-4 flex items-center gap-2">
                        {trend.value > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-400" />
                        ) : trend.value < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-400" />
                        ) : (
                            <Minus className="h-4 w-4 text-zinc-400" />
                        )}
                        <span className={cn(
                            'text-sm font-medium',
                            trend.value > 0 ? 'text-green-400' : trend.value < 0 ? 'text-red-400' : 'text-zinc-400'
                        )}>
                            {trend.value > 0 ? '+' : ''}{trend.value}%
                        </span>
                        <span className="text-xs text-zinc-500">{trend.label}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
