import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PATCH - Marcar todas como lidas
export async function PATCH() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const result = await prisma.adminNotification.updateMany({
            where: { isRead: false },
            data: {
                isRead: true,
                readAt: new Date()
            }
        })

        return NextResponse.json({
            message: `${result.count} notificação(ões) marcada(s) como lida(s)`,
            count: result.count
        })
    } catch (error) {
        console.error('[NOTIFICATIONS MARK ALL READ]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
