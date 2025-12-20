import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendPushNotification } from '@/lib/web-push'

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

    const body = await request.json()
    const { title, message, link, targetType } = body

    if (!title || !message || !targetType) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Buscar subscriptions baseado no targetType
    let whereClause: any = {}

    if (targetType === 'ASSINANTES') {
      whereClause = {
        user: {
          role: 'ASSINANTE'
        }
      }
    } else if (targetType === 'PARCEIROS') {
      whereClause = {
        user: {
          role: 'PARCEIRO'
        }
      }
    }
    // targetType === 'ALL' não precisa de filtro

    const subscriptions = await prisma.pushSubscription.findMany({
      where: whereClause,
      select: {
        id: true,
        endpoint: true,
        p256dh: true,
        auth: true
      }
    })

    console.log(`[PUSH SEND] Enviando para ${subscriptions.length} dispositivos`)

    // Enviar para todos
    let sentCount = 0
    let failedCount = 0
    const failedEndpoints: string[] = []

    for (const sub of subscriptions) {
      const success = await sendPushNotification(
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

      if (success) {
        sentCount++
      } else {
        failedCount++
        failedEndpoints.push(sub.endpoint)
      }
    }

    // Remover subscriptions inválidas (expiradas)
    if (failedEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: {
          endpoint: { in: failedEndpoints }
        }
      })
      console.log(`[PUSH SEND] Removidas ${failedEndpoints.length} subscriptions inválidas`)
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
