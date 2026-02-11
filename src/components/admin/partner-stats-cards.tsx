'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag, DollarSign, Star, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PartnerStatsCardsProps {
    totalTransacoes: number
    transacoesEsteMes: number
    receitaTotal: number
    receitaEsteMes: number
    mediaAvaliacao: number
    totalAvaliacoes: number
    ultimoAcesso?: string | null
}

export function PartnerStatsCards({
    totalTransacoes,
    transacoesEsteMes,
    receitaTotal,
    receitaEsteMes,
    mediaAvaliacao,
    totalAvaliacoes,
    ultimoAcesso
}: PartnerStatsCardsProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const renderStars = (rating: number) => {
        const stars = []
        const fullStars = Math.floor(rating)
        const hasHalfStar = rating % 1 >= 0.5

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                )
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <Star key={i} className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />
                )
            } else {
                stars.push(
                    <Star key={i} className="h-4 w-4 text-gray-300" />
                )
            }
        }
        return stars
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Transações */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700">
                        Transações
                    </CardTitle>
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4 text-blue-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-900">{totalTransacoes}</div>
                    <p className="text-xs text-blue-600 mt-1">
                        +{transacoesEsteMes} este mês
                    </p>
                </CardContent>
            </Card>

            {/* Receita */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-700">
                        Receita Total
                    </CardTitle>
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-900">
                        {formatCurrency(receitaTotal)}
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">
                        +{formatCurrency(receitaEsteMes)} este mês
                    </p>
                </CardContent>
            </Card>

            {/* Avaliação */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-yellow-700">
                        Avaliação
                    </CardTitle>
                    <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Star className="h-4 w-4 text-yellow-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-yellow-900">
                            {mediaAvaliacao > 0 ? mediaAvaliacao.toFixed(1) : '-'}
                        </span>
                        <div className="flex">
                            {renderStars(mediaAvaliacao)}
                        </div>
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">
                        {totalAvaliacoes} avaliação(ões)
                    </p>
                </CardContent>
            </Card>

            {/* Último Acesso */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-purple-700">
                        Último Acesso
                    </CardTitle>
                    <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold text-purple-900">
                        {ultimoAcesso
                            ? formatDistanceToNow(new Date(ultimoAcesso), {
                                addSuffix: true,
                                locale: ptBR
                            })
                            : 'Nunca acessou'
                        }
                    </div>
                    <p className="text-xs text-purple-600 mt-1">
                        pelo app do parceiro
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
