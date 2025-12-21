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
    let notifications: any[] = []

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
      totalSubscriptions = await prisma.pushSubscription.count()

      assinantesCount = await prisma.pushSubscription.count({
        where: { user: { role: 'ASSINANTE' } }
      })

      parceirosCount = await prisma.pushSubscription.count({
        where: { user: { role: 'PARCEIRO' } }
      })
    } catch (dbError: any) {
      // Se a tabela não existir, retornar zeros
      console.error('[PUSH HISTORY] Erro no banco:', dbError.message)

      // Verificar se é erro de tabela não existente
      if (dbError.message?.includes('does not exist') ||
          dbError.message?.includes('relation') ||
          dbError.code === 'P2021') {
        console.warn('[PUSH HISTORY] Tabela push_subscriptions não existe. Execute: npx prisma db push')
      }
    }

    return NextResponse.json({
      notifications: notifications.map((n: any) => ({
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

  } catch (error: any) {
    console.error('[PUSH HISTORY] Erro geral:', error)
    return NextResponse.json({
      notifications: [],
      stats: { total: 0, assinantes: 0, parceiros: 0 },
      error: 'Erro ao buscar histórico'
    })
  }
}
