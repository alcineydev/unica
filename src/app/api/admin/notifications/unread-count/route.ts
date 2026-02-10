import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Contador de não lidas
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const count = await prisma.adminNotification.count({
            where: { isRead: false }
        })

        return NextResponse.json({ count })
    } catch (error) {
        console.error('[NOTIFICATIONS UNREAD COUNT]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
