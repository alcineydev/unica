import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (!user || !['ADMIN', 'DEVELOPER'].includes(user.role)) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const body = await request.json()
        const { action, ids } = body

        if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Ação e IDs são obrigatórios' }, { status: 400 })
        }

        let result
        let message = ''

        switch (action) {
            case 'resend':
                // Marcar para reenvio - volta para DRAFT
                result = await prisma.notification.updateMany({
                    where: {
                        id: { in: ids },
                        status: { in: ['SENT', 'PARTIAL', 'FAILED'] }
                    },
                    data: {
                        status: 'DRAFT',
                        sentAt: null,
                        sentCount: 0,
                        failedCount: 0
                    }
                })
                message = `${result.count} notificação(ões) preparada(s) para reenvio`
                break

            case 'cancel':
                // Cancelar agendadas
                result = await prisma.notification.updateMany({
                    where: {
                        id: { in: ids },
                        status: 'SCHEDULED'
                    },
                    data: {
                        status: 'DRAFT'
                    }
                })
                message = `${result.count} agendamento(s) cancelado(s)`
                break

            case 'delete':
                // Não permitir excluir se estiver enviando
                const sendingCount = await prisma.notification.count({
                    where: {
                        id: { in: ids },
                        status: 'SENDING'
                    }
                })

                if (sendingCount > 0) {
                    return NextResponse.json({
                        error: 'Não é possível excluir notificações em envio'
                    }, { status: 400 })
                }

                result = await prisma.notification.deleteMany({
                    where: { id: { in: ids } }
                })
                message = `${result.count} notificação(ões) excluída(s)`
                break

            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
        }

        return NextResponse.json({ message, count: result?.count || 0 })
    } catch (error) {
        console.error('[NOTIFICACOES BULK]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
