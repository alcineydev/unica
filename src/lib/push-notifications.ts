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
  | 'BENEFIT_USED'
  | 'NEW_BENEFIT'
  | 'PROMOTION'
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

// Formatador de moeda
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

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
          link: url || '/',
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

// ============================================================
// FUNÇÕES BASE POR ROLE
// ============================================================

/**
 * Envia push notifications para ADMINs/DEVELOPERs
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
    url: url || '/admin',
    type,
    targetRoles: ['ADMIN', 'DEVELOPER']
  })
}

/**
 * Envia push para um ASSINANTE específico (pelo assinanteId)
 */
export async function sendPushToSubscriber(
  assinanteId: string,
  title: string,
  body: string,
  url?: string,
  type: PushNotificationType = 'SYSTEM_ALERT'
): Promise<PushResult> {
  try {
    // Buscar o userId do assinante
    const assinante = await prisma.assinante.findUnique({
      where: { id: assinanteId },
      select: { userId: true }
    })

    if (!assinante?.userId) {
      console.log('[PUSH-SERVICE] Assinante não encontrado ou sem userId')
      return { sent: 0, failed: 0, expiredRemoved: 0 }
    }

    return sendPush({
      title,
      body,
      url: url || '/app',
      type,
      targetUserIds: [assinante.userId]
    })
  } catch (error) {
    console.error('[PUSH-SERVICE] Erro ao enviar para assinante:', error)
    return { sent: 0, failed: 0, expiredRemoved: 0 }
  }
}

/**
 * Envia push para TODOS os assinantes ativos
 */
export async function sendPushToAllSubscribers(
  title: string,
  body: string,
  url?: string,
  type: PushNotificationType = 'PROMOTION'
): Promise<PushResult> {
  return sendPush({
    title,
    body,
    url: url || '/app',
    type,
    targetRoles: ['ASSINANTE']
  })
}

/**
 * Envia push para assinantes de um PLANO específico
 */
export async function sendPushToSubscribersByPlan(
  planId: string,
  title: string,
  body: string,
  url?: string,
  type: PushNotificationType = 'NEW_BENEFIT'
): Promise<PushResult> {
  try {
    // Buscar assinantes ativos do plano
    const assinantes = await prisma.assinante.findMany({
      where: {
        planId,
        subscriptionStatus: 'ACTIVE'
      },
      select: { userId: true }
    })

    const userIds = assinantes
      .map(a => a.userId)
      .filter((id): id is string => id !== null)

    if (userIds.length === 0) {
      console.log('[PUSH-SERVICE] Nenhum assinante ativo encontrado para o plano')
      return { sent: 0, failed: 0, expiredRemoved: 0 }
    }

    return sendPush({
      title,
      body,
      url: url || '/app/beneficios',
      type,
      targetUserIds: userIds
    })
  } catch (error) {
    console.error('[PUSH-SERVICE] Erro ao enviar para assinantes do plano:', error)
    return { sent: 0, failed: 0, expiredRemoved: 0 }
  }
}

/**
 * Envia push para um PARCEIRO específico (pelo parceiroId)
 */
export async function sendPushToPartner(
  parceiroId: string,
  title: string,
  body: string,
  url?: string,
  type: PushNotificationType = 'BENEFIT_USED'
): Promise<PushResult> {
  try {
    // Buscar o userId do parceiro
    const parceiro = await prisma.parceiro.findUnique({
      where: { id: parceiroId },
      select: { userId: true }
    })

    if (!parceiro?.userId) {
      console.log('[PUSH-SERVICE] Parceiro não encontrado ou sem userId')
      return { sent: 0, failed: 0, expiredRemoved: 0 }
    }

    return sendPush({
      title,
      body,
      url: url || '/parceiro',
      type,
      targetUserIds: [parceiro.userId]
    })
  } catch (error) {
    console.error('[PUSH-SERVICE] Erro ao enviar para parceiro:', error)
    return { sent: 0, failed: 0, expiredRemoved: 0 }
  }
}

/**
 * Envia push para TODOS os parceiros
 */
export async function sendPushToAllPartners(
  title: string,
  body: string,
  url?: string,
  type: PushNotificationType = 'SYSTEM_ALERT'
): Promise<PushResult> {
  return sendPush({
    title,
    body,
    url: url || '/parceiro',
    type,
    targetRoles: ['PARCEIRO']
  })
}

// ============================================================
// FUNÇÕES HELPER PARA EVENTOS ESPECÍFICOS - ADMINS
// ============================================================

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
  return sendPushToAdmins(
    '💰 Pagamento Confirmado',
    `${subscriberName} - ${formatCurrency(amount)}`,
    '/admin/assinantes',
    'PAYMENT_CONFIRMED'
  )
}

/**
 * Notifica admins sobre pagamento em atraso
 */
export async function notifyPaymentOverdue(subscriberName: string, amount: number): Promise<PushResult> {
  return sendPushToAdmins(
    '🚨 Pagamento em Atraso',
    `${subscriberName} - ${formatCurrency(amount)}`,
    '/admin/assinantes',
    'PAYMENT_OVERDUE'
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
 * Envia alerta genérico do sistema para admins
 */
export async function notifySystemAlert(title: string, message: string, url?: string): Promise<PushResult> {
  return sendPushToAdmins(
    title,
    message,
    url || '/admin',
    'SYSTEM_ALERT'
  )
}

// ============================================================
// FUNÇÕES HELPER PARA EVENTOS ESPECÍFICOS - ASSINANTES
// ============================================================

/**
 * Notifica assinante que a assinatura está vencendo
 */
export async function notifySubscriberExpiring(assinanteId: string, daysLeft: number): Promise<PushResult> {
  const message = daysLeft === 0
    ? 'Sua assinatura vence hoje! Renove agora para continuar aproveitando.'
    : daysLeft === 1
    ? 'Sua assinatura vence amanhã! Renove para não perder seus benefícios.'
    : `Sua assinatura vence em ${daysLeft} dias. Renove para continuar aproveitando!`

  return sendPushToSubscriber(
    assinanteId,
    '⏰ Assinatura Vencendo',
    message,
    '/app/perfil',
    'SUBSCRIPTION_EXPIRING'
  )
}

/**
 * Notifica assinante sobre novo benefício disponível
 */
export async function notifySubscriberNewBenefit(
  assinanteId: string,
  benefitName: string,
  partnerName: string
): Promise<PushResult> {
  return sendPushToSubscriber(
    assinanteId,
    '🎁 Novo Benefício!',
    `${benefitName} disponível em ${partnerName}`,
    '/app/beneficios',
    'NEW_BENEFIT'
  )
}

/**
 * Notifica todos os assinantes sobre promoção
 */
export async function notifyAllSubscribersPromotion(
  title: string,
  message: string,
  url?: string
): Promise<PushResult> {
  return sendPushToAllSubscribers(
    `📢 ${title}`,
    message,
    url || '/app',
    'PROMOTION'
  )
}

/**
 * Notifica assinantes de um plano sobre novo benefício
 */
export async function notifyPlanSubscribersNewBenefit(
  planId: string,
  benefitName: string,
  partnerName: string
): Promise<PushResult> {
  return sendPushToSubscribersByPlan(
    planId,
    '🎁 Novo Benefício no seu Plano!',
    `${benefitName} em ${partnerName}`,
    '/app/beneficios',
    'NEW_BENEFIT'
  )
}

// ============================================================
// FUNÇÕES HELPER PARA EVENTOS ESPECÍFICOS - PARCEIROS
// ============================================================

/**
 * Notifica parceiro quando um benefício é utilizado
 */
export async function notifyPartnerBenefitUsed(
  parceiroId: string,
  subscriberName: string,
  benefitName: string
): Promise<PushResult> {
  return sendPushToPartner(
    parceiroId,
    '🛒 Benefício Utilizado!',
    `${subscriberName} usou: ${benefitName}`,
    '/parceiro/transacoes',
    'BENEFIT_USED'
  )
}

/**
 * Notifica todos os parceiros com um comunicado
 */
export async function notifyAllPartnersAnnouncement(
  title: string,
  message: string,
  url?: string
): Promise<PushResult> {
  return sendPushToAllPartners(
    `📢 ${title}`,
    message,
    url || '/parceiro',
    'SYSTEM_ALERT'
  )
}

/**
 * Notifica parceiro sobre relatório semanal disponível
 */
export async function notifyPartnerWeeklyReport(parceiroId: string): Promise<PushResult> {
  return sendPushToPartner(
    parceiroId,
    '📊 Relatório Semanal',
    'Seu relatório de usos da semana está disponível!',
    '/parceiro/relatorios',
    'SYSTEM_ALERT'
  )
}
