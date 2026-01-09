import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  notifyNewSubscriber,
  notifyPaymentConfirmed,
  notifyPaymentOverdue,
  notifySubscriptionExpired
} from '@/lib/push-notifications'

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
    const { eventType } = body

    let result

    switch (eventType) {
      case 'NEW_SUBSCRIBER':
        result = await notifyNewSubscriber('João Silva (Teste)', 'Plano Premium')
        break
      case 'PAYMENT_CONFIRMED':
        result = await notifyPaymentConfirmed('Maria Santos (Teste)', 99.90)
        break
      case 'PAYMENT_OVERDUE':
        result = await notifyPaymentOverdue('Pedro Souza (Teste)', 49.90)
        break
      case 'SUBSCRIPTION_EXPIRED':
        result = await notifySubscriptionExpired('Ana Costa (Teste)')
        break
      default:
        return NextResponse.json({ error: 'Tipo de evento inválido' }, { status: 400 })
    }

    return NextResponse.json({
      success: result.sent > 0,
      eventType,
      ...result
    })

  } catch (error) {
    console.error('[TEST-WEBHOOK] Erro:', error)
    return NextResponse.json({
      error: 'Erro ao testar',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
