import prisma from '@/lib/prisma'
import { getEmailService } from '@/services/email'
import { getEvolutionApi } from '@/services/evolution-api'
import {
  notifySubscriberExpiring,
  sendPushToAdmins
} from '@/lib/push-notifications'

export type NotificationChannel = 'email' | 'whatsapp' | 'push'

export interface NotificationConfig {
  channels: NotificationChannel[]
  daysBeforeExpiration: number[]  // Ex: [7, 3, 1, 0] = notificar 7, 3, 1 dias antes e no dia
}

export interface NotificationResult {
  channel: NotificationChannel
  success: boolean
  error?: string
}

export interface AssinanteVencendo {
  id: string
  visitorId: string
  name: string
  email: string
  phone: string | null
  planName: string
  planPrice: number
  expiresAt: Date
  daysLeft: number
}

/**
 * Busca a instância padrão de WhatsApp
 */
export async function getDefaultWhatsAppInstance() {
  const instance = await prisma.whatsAppInstance.findFirst({
    where: {
      isDefault: true,
      status: 'connected'
    }
  })

  if (!instance) {
    // Se não tem padrão conectada, pegar qualquer uma conectada
    return prisma.whatsAppInstance.findFirst({
      where: { status: 'connected' }
    })
  }

  return instance
}

/**
 * Define uma instância como padrão
 */
export async function setDefaultWhatsAppInstance(instanceId: string) {
  // Remover default de todas
  await prisma.whatsAppInstance.updateMany({
    where: { isDefault: true },
    data: { isDefault: false }
  })

  // Definir nova como default
  return prisma.whatsAppInstance.update({
    where: { id: instanceId },
    data: { isDefault: true }
  })
}

/**
 * Busca assinantes com assinatura vencendo em X dias
 */
export async function getAssinantesVencendo(daysFromNow: number): Promise<AssinanteVencendo[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const targetDate = new Date(today)
  targetDate.setDate(targetDate.getDate() + daysFromNow)

  const nextDay = new Date(targetDate)
  nextDay.setDate(nextDay.getDate() + 1)

  const assinantes = await prisma.assinante.findMany({
    where: {
      subscriptionStatus: 'ACTIVE',
      planEndDate: {
        gte: targetDate,
        lt: nextDay
      }
    },
    include: {
      plan: true,
      user: {
        select: { email: true }
      }
    }
  })

  return assinantes.map(a => ({
    id: a.id,
    visitorId: a.qrCode, // usando qrCode como visitorId para push
    name: a.name || 'Assinante',
    email: a.user.email,
    phone: a.phone,
    planName: a.plan?.name || 'Plano',
    planPrice: a.plan?.price ? Number(a.plan.price) : 0,
    expiresAt: a.planEndDate!,
    daysLeft: daysFromNow
  }))
}

/**
 * Formata data para exibição
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Envia notificação por EMAIL
 */
export async function sendEmailNotification(
  assinante: AssinanteVencendo
): Promise<NotificationResult> {
  try {
    const emailService = getEmailService()

    if (!emailService) {
      return { channel: 'email', success: false, error: 'Email service não configurado' }
    }

    await emailService.sendPaymentReminderEmail(
      assinante.email,
      {
        name: assinante.name,
        dueDate: formatDate(assinante.expiresAt),
        amount: assinante.planPrice
      }
    )

    return { channel: 'email', success: true }
  } catch (error) {
    console.error('[NOTIF-EMAIL] Erro:', error)
    return {
      channel: 'email',
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Envia notificação por WHATSAPP
 */
export async function sendWhatsAppNotification(
  assinante: AssinanteVencendo
): Promise<NotificationResult> {
  try {
    if (!assinante.phone) {
      return { channel: 'whatsapp', success: false, error: 'Assinante sem telefone' }
    }

    const instance = await getDefaultWhatsAppInstance()

    if (!instance) {
      return { channel: 'whatsapp', success: false, error: 'Nenhuma instância WhatsApp conectada' }
    }

    const evolutionApi = getEvolutionApi()

    if (!evolutionApi) {
      return { channel: 'whatsapp', success: false, error: 'Evolution API não configurada' }
    }

    await evolutionApi.sendPaymentReminder(
      assinante.phone,
      {
        name: assinante.name,
        dueDate: assinante.daysLeft === 0
          ? 'HOJE'
          : `${assinante.daysLeft} dia(s) (${formatDate(assinante.expiresAt)})`,
        amount: assinante.planPrice
      }
    )

    return { channel: 'whatsapp', success: true }
  } catch (error) {
    console.error('[NOTIF-WHATSAPP] Erro:', error)
    return {
      channel: 'whatsapp',
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Envia notificação por PUSH
 */
export async function sendPushNotificationToSubscriber(
  assinante: AssinanteVencendo
): Promise<NotificationResult> {
  try {
    const result = await notifySubscriberExpiring(assinante.id, assinante.daysLeft)

    return {
      channel: 'push',
      success: result.sent > 0,
      error: result.sent === 0 ? 'Nenhum dispositivo registrado' : undefined
    }
  } catch (error) {
    console.error('[NOTIF-PUSH] Erro:', error)
    return {
      channel: 'push',
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Envia notificação por TODOS os canais configurados
 */
export async function sendMultiChannelNotification(
  assinante: AssinanteVencendo,
  channels: NotificationChannel[] = ['email', 'whatsapp', 'push']
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = []

  for (const channel of channels) {
    switch (channel) {
      case 'email':
        results.push(await sendEmailNotification(assinante))
        break
      case 'whatsapp':
        results.push(await sendWhatsAppNotification(assinante))
        break
      case 'push':
        results.push(await sendPushNotificationToSubscriber(assinante))
        break
    }
  }

  return results
}

/**
 * Executa o processo de notificação de vencimentos
 */
export async function processExpirationNotifications(
  config: NotificationConfig = {
    channels: ['email', 'whatsapp', 'push'],
    daysBeforeExpiration: [7, 3, 1, 0]
  }
): Promise<{
  processed: number
  results: Array<{
    assinante: string
    daysLeft: number
    notifications: NotificationResult[]
  }>
}> {
  const allResults: Array<{
    assinante: string
    daysLeft: number
    notifications: NotificationResult[]
  }> = []

  for (const days of config.daysBeforeExpiration) {
    const assinantes = await getAssinantesVencendo(days)

    console.log(`[CRON-VENCIMENTOS] ${assinantes.length} assinante(s) vencendo em ${days} dia(s)`)

    for (const assinante of assinantes) {
      const notifications = await sendMultiChannelNotification(assinante, config.channels)

      allResults.push({
        assinante: assinante.name,
        daysLeft: days,
        notifications
      })

      // Log detalhado
      const successCount = notifications.filter(n => n.success).length
      console.log(`[CRON-VENCIMENTOS] ${assinante.name}: ${successCount}/${notifications.length} canais com sucesso`)
    }
  }

  // Notificar admins sobre execução do cron
  if (allResults.length > 0) {
    await sendPushToAdmins(
      '📊 Cron de Vencimentos',
      `${allResults.length} assinante(s) notificado(s) sobre vencimento`,
      '/admin/assinantes',
      'SYSTEM_ALERT'
    )
  }

  return {
    processed: allResults.length,
    results: allResults
  }
}
