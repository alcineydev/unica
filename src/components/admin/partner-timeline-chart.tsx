'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

interface TimelineData {
    month: string
    label: string
    count: number
    amount: number
}

interface PartnerTimelineChartProps {
    data: TimelineData[]
    type?: 'count' | 'amount'
}

export function PartnerTimelineChart({ data, type = 'count' }: PartnerTimelineChartProps) {
    const values = type === 'count'
        ? data.map(d => d.count)
        : data.map(d => d.amount)

    const maxValue = Math.max(...values, 1)

    const formatValue = (value: number) => {
        if (type === 'amount') {
            if (value >= 1000) {
                return `R$ ${(value / 1000).toFixed(1)}k`
            }
            return `R$ ${value.toFixed(0)}`
        }
        return value.toString()
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5" />
                    {type === 'count' ? 'Transações' : 'Receita'} (6 meses)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-end justify-between gap-2 h-24">
                    {data.map((item, index) => {
                        const value = type === 'count' ? item.count : item.amount
                        const height = maxValue > 0 ? (value / maxValue) * 100 : 0

                        return (
                            <div key={index} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] font-medium text-muted-foreground">
                                    {formatValue(value)}
                                </span>
                                <div className="w-full flex-1 flex items-end">
                                    <div
                                        className={`w-full rounded-t-md transition-all duration-500 ${type === 'count'
                                                ? 'bg-gradient-to-t from-blue-500 to-blue-400'
                                                : 'bg-gradient-to-t from-emerald-500 to-emerald-400'
                                            }`}
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                    />
                                </div>
                                <span className="text-[10px] text-muted-foreground capitalize">
                                    {item.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
