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

    // Tentar buscar estatísticas de push
    let totalSubscriptions = 0
    let assinantesCount = 0
    let parceirosCount = 0
    let adminsCount = 0
    type NotificationWithAdmin = {
      id: string
      title: string
      message: string
      link: string | null
      targetType: string
      sentCount: number
      failedCount: number
      createdAt: Date
      admin: { email: string } | null
    }
    let notifications: NotificationWithAdmin[] = []

    try {
      // Buscar histórico
      notifications = await prisma.adminPushNotification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          admin: {
            select: { email: true }
          }
        }
      })

      // Contar subscriptions por tipo
      totalSubscriptions = await prisma.pushSubscription.count({
        where: { isActive: true }
      })

      // Buscar subscriptions com dados do usuário para contar por role
      const subscriptionsWithUser = await prisma.pushSubscription.findMany({
        where: { isActive: true },
        select: {
          user: {
            select: { role: true }
          }
        }
      })

      // Contar por role
      assinantesCount = subscriptionsWithUser.filter(s => s.user?.role === 'ASSINANTE').length
      parceirosCount = subscriptionsWithUser.filter(s => s.user?.role === 'PARCEIRO').length
      adminsCount = subscriptionsWithUser.filter(s => s.user?.role === 'ADMIN' || s.user?.role === 'DEVELOPER').length
    } catch (dbError) {
      // Se a tabela não existir, retornar zeros
      const err = dbError as Error & { code?: string }
      console.error('[PUSH HISTORY] Erro no banco:', err.message)

      // Verificar se é erro de tabela não existente
      if (err.message?.includes('does not exist') ||
          err.message?.includes('relation') ||
          err.code === 'P2021') {
        console.warn('[PUSH HISTORY] Tabela push_subscriptions não existe. Execute: npx prisma db push')
      }
    }

    return NextResponse.json({
      notifications: notifications.map((n) => ({
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
        parceiros: parceirosCount,
        admins: adminsCount
      }
    })

  } catch (error) {
    const err = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[PUSH HISTORY] Erro geral:', err)
    return NextResponse.json({
      notifications: [],
      stats: { total: 0, assinantes: 0, parceiros: 0, admins: 0 },
      error: 'Erro ao buscar histórico'
    })
  }
}
