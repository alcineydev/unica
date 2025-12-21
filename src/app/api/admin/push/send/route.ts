import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendPushNotification, isWebPushConfigured } from '@/lib/web-push'

export async function POST(request: NextRequest) {
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

    // Verificar se VAPID está configurado
    if (!isWebPushConfigured()) {
      return NextResponse.json(
        { error: 'Push notifications não configuradas. Configure as VAPID keys no ambiente.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { title, message, link, targetType } = body

    if (!title || !message || !targetType) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Buscar subscriptions baseado no targetType
    let subscriptions: any[] = []

    try {
      let whereClause: any = {}

      if (targetType === 'ASSINANTES') {
        whereClause = { user: { role: 'ASSINANTE' } }
      } else if (targetType === 'PARCEIROS') {
        whereClause = { user: { role: 'PARCEIRO' } }
      }
      // targetType === 'ALL' não precisa de filtro

      subscriptions = await prisma.pushSubscription.findMany({
        where: whereClause,
        select: {
          id: true,
          endpoint: true,
          p256dh: true,
          auth: true
        }
      })
    } catch (dbError: any) {
      console.error('[PUSH SEND] Erro no banco:', dbError.message)

      // Se tabela não existe
      if (dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        return NextResponse.json({
          success: false,
          sentCount: 0,
          failedCount: 0,
          error: 'Tabela de subscriptions não existe. Execute: npx prisma db push'
        }, { status: 500 })
      }

      throw dbError
    }

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        failedCount: 0,
        total: 0,
        message: 'Nenhum dispositivo registrado para receber notificações'
      })
    }

    // Enviar para todos
    let sentCount = 0
    let failedCount = 0
    const expiredEndpoints: string[] = []

    for (const sub of subscriptions) {
      const result = await sendPushNotification(
        {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth
        },
        {
          title,
          message,
          link: link || '/',
          icon: '/icons/icon-192x192.png'
        }
      )

      if (result.success) {
        sentCount++
      } else {
        failedCount++
        if (result.expired) {
          expiredEndpoints.push(sub.endpoint)
        }
      }
    }

    // Remover apenas subscriptions expiradas (não todas as falhas)
    if (expiredEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: {
          endpoint: { in: expiredEndpoints }
        }
      })
    }

    // Salvar log da notificação
    await prisma.adminPushNotification.create({
      data: {
        title,
        message,
        link: link || null,
        targetType,
        sentCount,
        failedCount,
        createdBy: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      total: subscriptions.length
    })

  } catch (error) {
    console.error('[PUSH SEND] Erro:', error)
    return NextResponse.json({ error: 'Erro ao enviar notificações' }, { status: 500 })
  }
}
