import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  sendPushToAllSubscribers,
  sendPushToAllPartners,
  sendPushToSubscribersByPlan,
  sendPushToAdmins
} from '@/lib/push-notifications'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !['DEVELOPER', 'ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { title, message, link, target, planId } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Título e mensagem são obrigatórios' }, { status: 400 })
    }

    if (!target) {
      return NextResponse.json({ error: 'Target é obrigatório' }, { status: 400 })
    }

    let result

    switch (target) {
      case 'all-subscribers':
        result = await sendPushToAllSubscribers(
          `📢 ${title}`,
          message,
          link || '/app'
        )
        break

      case 'plan-subscribers':
        if (!planId) {
          return NextResponse.json({ error: 'Plano é obrigatório para este target' }, { status: 400 })
        }
        result = await sendPushToSubscribersByPlan(
          planId,
          `📢 ${title}`,
          message,
          link || '/app/beneficios'
        )
        break

      case 'all-partners':
        result = await sendPushToAllPartners(
          `📢 ${title}`,
          message,
          link || '/parceiro'
        )
        break

      case 'admins':
        result = await sendPushToAdmins(
          `📢 ${title}`,
          message,
          link || '/admin'
        )
        break

      default:
        return NextResponse.json({ error: 'Target inválido' }, { status: 400 })
    }

    console.log(`[PUSH-TARGETED] Enviado por ${session.user.email}: ${target} - ${title}`)

    return NextResponse.json({
      success: result.sent > 0 || result.failed === 0,
      ...result,
      target,
      title,
      sentBy: session.user.email
    })

  } catch (error) {
    console.error('[PUSH-TARGETED] Erro:', error)
    return NextResponse.json({
      error: 'Erro ao enviar notificações',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
