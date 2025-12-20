import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin ou developer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !['ADMIN', 'DEVELOPER'].includes(user.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Buscar histórico
    const notifications = await prisma.adminPushNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        admin: {
          select: { email: true }
        }
      }
    })

    // Contar subscriptions por tipo
    const totalSubscriptions = await prisma.pushSubscription.count()

    const assinantesCount = await prisma.pushSubscription.count({
      where: { user: { role: 'ASSINANTE' } }
    })

    const parceirosCount = await prisma.pushSubscription.count({
      where: { user: { role: 'PARCEIRO' } }
    })

    return NextResponse.json({
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        link: n.link,
        targetType: n.targetType,
        sentCount: n.sentCount,
        failedCount: n.failedCount,
        createdBy: n.admin?.email || 'Admin',
        createdAt: n.createdAt.toISOString()
      })),
      stats: {
        total: totalSubscriptions,
        assinantes: assinantesCount,
        parceiros: parceirosCount
      }
    })

  } catch (error) {
    console.error('[PUSH HISTORY] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
  }
}
