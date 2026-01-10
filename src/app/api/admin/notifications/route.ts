import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Listar notificações do admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {
      userId: session.user.id,
    }

    if (unreadOnly) {
      where.read = false
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.panelNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.panelNotification.count({
        where: {
          userId: session.user.id,
          read: false,
        },
      }),
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Marcar notificações como lidas
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, markAllRead } = body

    if (markAllRead) {
      // Marcar todas como lidas
      await prisma.panelNotification.updateMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        data: { read: true },
      })
    } else if (notificationIds?.length) {
      // Marcar específicas como lidas
      await prisma.panelNotification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
        data: { read: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar notificações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
