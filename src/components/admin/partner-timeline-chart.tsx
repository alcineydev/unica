'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Calendar } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface TimelineData {
    month: string
    label: string
    count: number
    amount: number
}

interface PartnerTimelineChartProps {
    data: TimelineData[]
    type?: 'count' | 'amount'
    onPeriodChange?: (period: string) => void
}

export function PartnerTimelineChart({
    data,
    type = 'count',
    onPeriodChange
}: PartnerTimelineChartProps) {
    const [period, setPeriod] = useState('6')

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

    const handlePeriodChange = (newPeriod: string) => {
        setPeriod(newPeriod)
        onPeriodChange?.(newPeriod)
    }

    // Filtrar dados baseado no período
    const filteredData = data.slice(-parseInt(period))

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="h-5 w-5" />
                        {type === 'count' ? 'Transações' : 'Receita'}
                    </CardTitle>
                    <Select value={period} onValueChange={handlePeriodChange}>
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="3">3 meses</SelectItem>
                            <SelectItem value="6">6 meses</SelectItem>
                            <SelectItem value="12">12 meses</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-end justify-between gap-2 h-24">
                    {filteredData.map((item, index) => {
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

                {/* Total no período */}
                <div className="mt-4 pt-3 border-t flex justify-between text-sm">
                    <span className="text-muted-foreground">Total no período:</span>
                    <span className="font-semibold">
                        {type === 'count'
                            ? filteredData.reduce((sum, d) => sum + d.count, 0)
                            : `R$ ${filteredData.reduce((sum, d) => sum + d.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        }
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}
