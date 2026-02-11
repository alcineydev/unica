'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

interface TimelineData {
    month: string
    label: string
    count: number
}

interface PlanTimelineChartProps {
    data: TimelineData[]
}

export function PlanTimelineChart({ data }: PlanTimelineChartProps) {
    const maxCount = Math.max(...data.map(d => d.count), 1)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5" />
                    Evolução de Assinantes
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-end justify-between gap-2 h-32">
                    {data.map((item, index) => {
                        const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0

                        return (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                    {item.count}
                                </span>
                                <div className="w-full flex-1 flex items-end">
                                    <div
                                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all duration-500"
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground capitalize">
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
