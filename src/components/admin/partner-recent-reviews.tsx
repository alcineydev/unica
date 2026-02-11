'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, MessageSquare, ArrowUpRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface Review {
    id: string
    nota: number
    comentario?: string
    resposta?: string
    publicada: boolean
    createdAt: string
    assinante?: {
        id: string
        name: string
    }
}

interface PartnerRecentReviewsProps {
    reviews: Review[]
}

export function PartnerRecentReviews({ reviews }: PartnerRecentReviewsProps) {
    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`h-3 w-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
            />
        ))
    }

    if (reviews.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <MessageSquare className="h-5 w-5" />
                        Avaliações Recentes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma avaliação encontrada</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="h-5 w-5" />
                    Avaliações Recentes
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {reviews.map((review) => (
                    <div
                        key={review.id}
                        className="p-3 rounded-lg bg-gray-50 space-y-2"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex">{renderStars(review.nota)}</div>
                                <Badge
                                    variant={review.publicada ? 'default' : 'secondary'}
                                    className="text-xs"
                                >
                                    {review.publicada ? 'Publicada' : 'Pendente'}
                                </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {format(new Date(review.createdAt), "dd/MM/yy", { locale: ptBR })}
                            </span>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                    {review.assinante?.name || 'Assinante'}
                                </p>
                                {review.comentario && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        "{review.comentario}"
                                    </p>
                                )}
                                {review.resposta && (
                                    <p className="text-xs text-blue-600 mt-1 line-clamp-1">
                                        ↳ Resposta: "{review.resposta}"
                                    </p>
                                )}
                            </div>
                            {review.assinante && (
                                <Link
                                    href={`/admin/assinantes/${review.assinante.id}`}
                                    className="p-1 rounded-full hover:bg-gray-200 flex-shrink-0"
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
