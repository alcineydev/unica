import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
    notifyExpiringSoon,
    notifyExpiringToday,
    notifyExpired
} from '@/lib/admin-notifications'

// Verifica se a requisição vem do Vercel Cron
function isValidCronRequest(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Em desenvolvimento, permite sem autenticação
    if (process.env.NODE_ENV === 'development') {
        return true
    }

    // Em produção, verifica o secret do Vercel Cron
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
        return true
    }

    return false
}

export async function GET(request: NextRequest) {
    try {
        // Validar requisição
        if (!isValidCronRequest(request)) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const in7Days = new Date(today)
        in7Days.setDate(in7Days.getDate() + 7)

        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        let expiringSoonCount = 0
        let expiringTodayCount = 0
        let expiredCount = 0

        // ============================================
        // 1. Assinantes que expiram em 7 dias
        // ============================================
        const expiringSoon = await prisma.assinante.findMany({
            where: {
                subscriptionStatus: 'ACTIVE',
                planEndDate: {
                    gte: in7Days,
                    lt: new Date(in7Days.getTime() + 24 * 60 * 60 * 1000) // + 1 dia
                }
            },
            select: {
                id: true,
                name: true,
                planEndDate: true
            }
        })

        for (const assinante of expiringSoon) {
            // Verificar se já existe notificação recente para este assinante
            const existingNotification = await prisma.adminNotification.findFirst({
                where: {
                    type: 'EXPIRING_SOON',
                    data: {
                        path: ['assinanteId'],
                        equals: assinante.id
                    },
                    createdAt: {
                        gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // últimas 24h
                    }
                }
            })

            if (!existingNotification) {
                await notifyExpiringSoon({
                    id: assinante.id,
                    name: assinante.name,
                    daysLeft: 7
                })
                expiringSoonCount++
            }
        }

        // ============================================
        // 2. Assinantes que expiram HOJE
        // ============================================
        const expiringToday = await prisma.assinante.findMany({
            where: {
                subscriptionStatus: 'ACTIVE',
                planEndDate: {
                    gte: today,
                    lt: tomorrow
                }
            },
            select: {
                id: true,
                name: true
            }
        })

        for (const assinante of expiringToday) {
            const existingNotification = await prisma.adminNotification.findFirst({
                where: {
                    type: 'EXPIRING_TODAY',
                    data: {
                        path: ['assinanteId'],
                        equals: assinante.id
                    },
                    createdAt: {
                        gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
                    }
                }
            })

            if (!existingNotification) {
                await notifyExpiringToday({
                    id: assinante.id,
                    name: assinante.name
                })
                expiringTodayCount++
            }
        }

        // ============================================
        // 3. Assinantes EXPIRADOS (status ACTIVE mas data passou)
        // ============================================
        const expired = await prisma.assinante.findMany({
            where: {
                subscriptionStatus: 'ACTIVE',
                planEndDate: {
                    lt: today
                }
            },
            select: {
                id: true,
                name: true
            }
        })

        for (const assinante of expired) {
            const existingNotification = await prisma.adminNotification.findFirst({
                where: {
                    type: 'EXPIRED',
                    data: {
                        path: ['assinanteId'],
                        equals: assinante.id
                    },
                    createdAt: {
                        gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
                    }
                }
            })

            if (!existingNotification) {
                await notifyExpired({
                    id: assinante.id,
                    name: assinante.name
                })
                expiredCount++

                // Atualizar status para EXPIRED
                await prisma.assinante.update({
                    where: { id: assinante.id },
                    data: { subscriptionStatus: 'EXPIRED' }
                })
            }
        }

        const summary = {
            message: 'Verificação de vencimentos concluída',
            timestamp: now.toISOString(),
            results: {
                expiringSoon: {
                    found: expiringSoon.length,
                    notified: expiringSoonCount
                },
                expiringToday: {
                    found: expiringToday.length,
                    notified: expiringTodayCount
                },
                expired: {
                    found: expired.length,
                    notified: expiredCount
                }
            },
            totalNotifications: expiringSoonCount + expiringTodayCount + expiredCount
        }

        console.log('[CRON CHECK-EXPIRATIONS]', JSON.stringify(summary, null, 2))

        return NextResponse.json(summary)
    } catch (error) {
        console.error('[CRON CHECK-EXPIRATIONS ERROR]', error)
        return NextResponse.json(
            { error: 'Erro ao verificar vencimentos', details: String(error) },
            { status: 500 }
        )
    }
}
