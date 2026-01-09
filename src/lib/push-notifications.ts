import { sendPushNotification, isWebPushConfigured } from '@/lib/web-push'
import prisma from '@/lib/prisma'

export type PushNotificationType =
  | 'NEW_SUBSCRIBER'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_OVERDUE'
  | 'SUBSCRIPTION_EXPIRING'
  | 'SUBSCRIPTION_EXPIRED'
  | 'PLAN_UPGRADE'
  | 'PARTNER_TRANSACTION'
  | 'SYSTEM_ALERT'
  | 'TEST'

interface SendPushOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  type: PushNotificationType
  targetRoles?: string[]
  targetUserIds?: string[]
}

interface PushResult {
  sent: number
  failed: number
  expiredRemoved: number
}

/**
 * Envia push notifications para admins sobre eventos do sistema
 */
export async function sendPushToAdmins(
  title: string,
  body: string,
  url?: string,
  type: PushNotificationType = 'SYSTEM_ALERT'
): Promise<PushResult> {
  return sendPush({
    title,
    body,
    url,
    type,
    targetRoles: ['ADMIN', 'DEVELOPER']
  })
}

/**
 * Envia push notification genérica
 */
export async function sendPush(options: SendPushOptions): Promise<PushResult> {
  const { title, body, icon, badge, url, type, targetRoles, targetUserIds } = options

  if (!isWebPushConfigured()) {
    console.error('[PUSH-SERVICE] VAPID keys não configuradas')
    return { sent: 0, failed: 0, expiredRemoved: 0 }
  }

  try {
    // Construir query de busca
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      isActive: true
    }

    if (targetUserIds && targetUserIds.length > 0) {
      whereClause.userId = { in: targetUserIds }
    } else if (targetRoles && targetRoles.length > 0) {
      whereClause.user = { role: { in: targetRoles } }
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, email: true, role: true }
        }
      }
    })

    if (subscriptions.length === 0) {
      console.log(`[PUSH-SERVICE] Nenhuma subscription encontrada para envio`)
      return { sent: 0, failed: 0, expiredRemoved: 0 }
    }

    console.log(`[PUSH-SERVICE] Enviando para ${subscriptions.length} dispositivos - Tipo: ${type}`)

    let sent = 0
    let failed = 0
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
          message: body,
          icon: icon || '/icons/icon-192x192.png',
          badge: badge || '/icons/badge-72x72.png',
          link: url || '/admin',
          tag: type
        }
      )

      if (result.success) {
        sent++
        console.log(`[PUSH-SERVICE] ✅ ${sub.user?.email} (${sub.user?.role})`)
      } else {
        failed++
        if (result.expired) {
          expiredEndpoints.push(sub.endpoint)
          console.log(`[PUSH-SERVICE] ⚠️ Expirado: ${sub.user?.email}`)
        } else {
          console.log(`[PUSH-SERVICE] ❌ Falha: ${sub.user?.email}`)
        }
      }
    }

    // Remover subscriptions expiradas
    if (expiredEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: expiredEndpoints } }
      })
    }

    console.log(`[PUSH-SERVICE] Resultado: ${sent} enviados, ${failed} falhas, ${expiredEndpoints.length} expirados removidos`)

    return { sent, failed, expiredRemoved: expiredEndpoints.length }

  } catch (error) {
    console.error('[PUSH-SERVICE] Erro ao enviar:', error)
    return { sent: 0, failed: 0, expiredRemoved: 0 }
  }
}

/**
 * Notifica admins sobre novo assinante
 */
export async function notifyNewSubscriber(subscriberName: string, planName: string): Promise<PushResult> {
  return sendPushToAdmins(
    '🎉 Novo Assinante!',
    `${subscriberName} assinou o plano ${planName}`,
    '/admin/assinantes',
    'NEW_SUBSCRIBER'
  )
}

/**
 * Notifica admins sobre pagamento confirmado
 */
export async function notifyPaymentConfirmed(subscriberName: string, amount: number): Promise<PushResult> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount)

  return sendPushToAdmins(
    '💰 Pagamento Confirmado',
    `${subscriberName} - ${formattedAmount}`,
    '/admin/assinantes',
    'PAYMENT_CONFIRMED'
  )
}

/**
 * Notifica admins sobre assinatura vencendo
 */
export async function notifySubscriptionExpiring(subscriberName: string, daysLeft: number): Promise<PushResult> {
  return sendPushToAdmins(
    '⚠️ Assinatura Vencendo',
    `${subscriberName} - vence em ${daysLeft} dia(s)`,
    '/admin/assinantes',
    'SUBSCRIPTION_EXPIRING'
  )
}

/**
 * Notifica admins sobre assinatura expirada
 */
export async function notifySubscriptionExpired(subscriberName: string): Promise<PushResult> {
  return sendPushToAdmins(
    '❌ Assinatura Expirada',
    `A assinatura de ${subscriberName} expirou`,
    '/admin/assinantes',
    'SUBSCRIPTION_EXPIRED'
  )
}

/**
 * Notifica admins sobre upgrade de plano
 */
export async function notifyPlanUpgrade(subscriberName: string, oldPlan: string, newPlan: string): Promise<PushResult> {
  return sendPushToAdmins(
    '⬆️ Upgrade de Plano',
    `${subscriberName}: ${oldPlan} → ${newPlan}`,
    '/admin/assinantes',
    'PLAN_UPGRADE'
  )
}

/**
 * Notifica admins sobre transação de parceiro
 */
export async function notifyPartnerTransaction(partnerName: string, subscriberName: string): Promise<PushResult> {
  return sendPushToAdmins(
    '🏪 Uso de Benefício',
    `${subscriberName} usou benefício em ${partnerName}`,
    '/admin/parceiros',
    'PARTNER_TRANSACTION'
  )
}

/**
 * Notifica admins sobre pagamento em atraso
 */
export async function notifyPaymentOverdue(subscriberName: string, amount: number): Promise<PushResult> {
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount)

  return sendPushToAdmins(
    '🚨 Pagamento em Atraso',
    `${subscriberName} - ${formattedAmount}`,
    '/admin/assinantes',
    'PAYMENT_OVERDUE'
  )
}

/**
 * Envia alerta genérico do sistema
 */
export async function notifySystemAlert(title: string, message: string, url?: string): Promise<PushResult> {
  return sendPushToAdmins(
    title,
    message,
    url || '/admin',
    'SYSTEM_ALERT'
  )
}
