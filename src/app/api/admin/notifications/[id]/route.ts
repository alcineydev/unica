import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// PATCH - Marcar como lida/não lida
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { isRead } = body

        const notification = await prisma.adminNotification.update({
            where: { id },
            data: {
                isRead: isRead ?? true,
                readAt: isRead ? new Date() : null
            }
        })

        return NextResponse.json(notification)
    } catch (error) {
        console.error('[NOTIFICATION PATCH]', error)
        return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
    }
}

// DELETE - Excluir notificação
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { id } = await params

        await prisma.adminNotification.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Notificação excluída' })
    } catch (error) {
        console.error('[NOTIFICATION DELETE]', error)
        return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
    }
}
