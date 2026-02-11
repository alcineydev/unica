'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Receipt, ArrowUpRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface Transaction {
    id: string
    type: string
    amount: number
    status: string
    description: string
    createdAt: string
    assinante?: {
        id: string
        name: string
    }
}

interface PartnerRecentTransactionsProps {
    transactions: Transaction[]
}

const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
}

const statusLabels: Record<string, string> = {
    COMPLETED: 'Concluída',
    PENDING: 'Pendente',
    FAILED: 'Falhou',
    CANCELLED: 'Cancelada',
}

const typeLabels: Record<string, string> = {
    PURCHASE: 'Compra',
    CASHBACK: 'Cashback',
    BONUS: 'Bônus',
    REFUND: 'Reembolso',
}

export function PartnerRecentTransactions({ transactions }: PartnerRecentTransactionsProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    if (transactions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Receipt className="h-5 w-5" />
                        Transações Recentes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Receipt className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma transação encontrada</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Receipt className="h-5 w-5" />
                    Transações Recentes
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {transactions.map((transaction) => (
                    <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">
                                    {transaction.assinante?.name || 'Assinante'}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                    {typeLabels[transaction.type] || transaction.type}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(transaction.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="font-semibold text-sm">
                                    {formatCurrency(Number(transaction.amount))}
                                </p>
                                <Badge className={`text-xs ${statusColors[transaction.status] || 'bg-gray-100'}`}>
                                    {statusLabels[transaction.status] || transaction.status}
                                </Badge>
                            </div>
                            {transaction.assinante && (
                                <Link
                                    href={`/admin/assinantes/${transaction.assinante.id}`}
                                    className="p-1 rounded-full hover:bg-gray-200"
                                >
                                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
