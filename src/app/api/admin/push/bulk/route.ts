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
            case 'delete':
                result = await prisma.adminPushNotification.deleteMany({
                    where: { id: { in: ids } }
                })
                message = `${result.count} notificação(ões) push excluída(s)`
                break

            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
        }

        return NextResponse.json({ message, count: result?.count || 0 })
    } catch (error) {
        console.error('[PUSH BULK]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
