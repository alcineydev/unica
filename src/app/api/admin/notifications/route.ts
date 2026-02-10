import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Listar notificações
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '20')
        const unreadOnly = searchParams.get('unreadOnly') === 'true'

        const where = unreadOnly ? { isRead: false } : {}

        const notifications = await prisma.adminNotification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit
        })

        return NextResponse.json(notifications)
    } catch (error) {
        console.error('[NOTIFICATIONS GET]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// DELETE - Excluir todas as notificações lidas
export async function DELETE(request: NextRequest) {
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

        const { searchParams } = new URL(request.url)
        const deleteAll = searchParams.get('all') === 'true'

        if (deleteAll) {
            await prisma.adminNotification.deleteMany({})
            return NextResponse.json({ message: 'Todas as notificações excluídas' })
        }

        // Por padrão, exclui apenas as lidas
        const result = await prisma.adminNotification.deleteMany({
            where: { isRead: true }
        })

        return NextResponse.json({
            message: `${result.count} notificação(ões) excluída(s)`,
            count: result.count
        })
    } catch (error) {
        console.error('[NOTIFICATIONS DELETE]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
