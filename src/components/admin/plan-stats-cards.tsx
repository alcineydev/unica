'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, DollarSign, UserPlus } from 'lucide-react'

interface PlanStatsCardsProps {
    totalAssinantes: number
    assinantesAtivos: number
    receitaMensal: number
    novosEsteMes: number
}

export function PlanStatsCards({
    totalAssinantes,
    assinantesAtivos,
    receitaMensal,
    novosEsteMes
}: PlanStatsCardsProps) {
    const taxaAtivos = totalAssinantes > 0
        ? ((assinantesAtivos / totalAssinantes) * 100).toFixed(1)
        : '0'

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Assinantes */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700">
                        Assinantes
                    </CardTitle>
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-900">{totalAssinantes}</div>
                    <p className="text-xs text-blue-600 mt-1">
                        {assinantesAtivos} ativos ({taxaAtivos}%)
                    </p>
                </CardContent>
            </Card>

            {/* Novos Este Mês */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-green-700">
                        Novos (Mês)
                    </CardTitle>
                    <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <UserPlus className="h-4 w-4 text-green-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-900">+{novosEsteMes}</div>
                    <p className="text-xs text-green-600 mt-1">
                        cadastros este mês
                    </p>
                </CardContent>
            </Card>

            {/* Receita Mensal */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-700">
                        Receita Mensal
                    </CardTitle>
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-900">
                        R$ {receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">
                        estimativa baseada em ativos
                    </p>
                </CardContent>
            </Card>

            {/* Taxa de Retenção */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-purple-700">
                        Taxa de Retenção
                    </CardTitle>
                    <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-purple-900">{taxaAtivos}%</div>
                    <p className="text-xs text-purple-600 mt-1">
                        assinantes ativos
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
