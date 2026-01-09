import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  notifyNewSubscriber,
  notifyPaymentConfirmed,
  notifyPaymentOverdue,
  notifySubscriptionExpired,
  sendPushToAllSubscribers,
  sendPushToAllPartners
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
      // Eventos para Admins
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

      // Eventos para Assinantes (envia para todos como teste)
      case 'SUBSCRIBER_EXPIRING':
        result = await sendPushToAllSubscribers(
          '⏰ Assinatura Vencendo',
          'Sua assinatura vence em 3 dias. Renove agora!',
          '/app/perfil',
          'SUBSCRIPTION_EXPIRING'
        )
        break
      case 'NEW_BENEFIT':
        result = await sendPushToAllSubscribers(
          '🎁 Novo Benefício!',
          '20% de desconto em Pizza Hut disponível!',
          '/app/beneficios',
          'NEW_BENEFIT'
        )
        break
      case 'PROMOTION':
        result = await sendPushToAllSubscribers(
          '📢 Promoção Especial!',
          'Indique um amigo e ganhe 1 mês grátis!',
          '/app',
          'PROMOTION'
        )
        break

      // Eventos para Parceiros
      case 'BENEFIT_USED':
        result = await sendPushToAllPartners(
          '🛒 Benefício Utilizado!',
          'João Silva usou: 20% de desconto (Teste)',
          '/parceiro/transacoes',
          'BENEFIT_USED'
        )
        break
      case 'PARTNER_ANNOUNCEMENT':
        result = await sendPushToAllPartners(
          '📢 Comunicado',
          'Novo relatório de usos disponível!',
          '/parceiro',
          'SYSTEM_ALERT'
        )
        break

      default:
        return NextResponse.json({ error: 'Tipo de evento inválido' }, { status: 400 })
    }

    return NextResponse.json({
      success: result.sent > 0 || result.failed === 0,
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
