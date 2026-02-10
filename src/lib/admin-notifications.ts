import prisma from '@/lib/prisma'

type AdminNotificationType =
    | 'NEW_SUBSCRIBER'
    | 'NEW_PARTNER'
    | 'TRANSACTION'
    | 'EXPIRING_SOON'
    | 'EXPIRING_TODAY'
    | 'EXPIRED'
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_FAILED'
    | 'SYSTEM'

type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

interface CreateNotificationParams {
    type: AdminNotificationType
    title: string
    message: string
    data?: Record<string, unknown>
    actionUrl?: string
    priority?: NotificationPriority
}

/**
 * Cria uma notificação para o painel admin
 */
export async function createAdminNotification({
    type,
    title,
    message,
    data,
    actionUrl,
    priority = 'NORMAL'
}: CreateNotificationParams) {
    try {
        const notification = await prisma.adminNotification.create({
            data: {
                type,
                title,
                message,
                data: (data as any) || undefined,
                actionUrl: actionUrl || null,
                priority
            }
        })
        return notification
    } catch (error) {
        console.error('[CREATE_ADMIN_NOTIFICATION]', error)
        return null
    }
}

/**
 * Notificação: Novo Assinante
 */
export async function notifyNewSubscriber(assinante: {
    id: string
    name: string
    planName?: string
}) {
    return createAdminNotification({
        type: 'NEW_SUBSCRIBER',
        title: 'Novo Assinante',
        message: `${assinante.name} acabou de se cadastrar${assinante.planName ? ` no plano ${assinante.planName}` : ''}`,
        data: { assinanteId: assinante.id },
        actionUrl: `/admin/assinantes/${assinante.id}`,
        priority: 'NORMAL'
    })
}

/**
 * Notificação: Novo Parceiro
 */
export async function notifyNewPartner(parceiro: {
    id: string
    name: string
    categoryName?: string
}) {
    return createAdminNotification({
        type: 'NEW_PARTNER',
        title: 'Novo Parceiro',
        message: `${parceiro.name} foi cadastrado${parceiro.categoryName ? ` na categoria ${parceiro.categoryName}` : ''}`,
        data: { parceiroId: parceiro.id },
        actionUrl: `/admin/parceiros/${parceiro.id}`,
        priority: 'NORMAL'
    })
}

/**
 * Notificação: Nova Transação
 */
export async function notifyTransaction(transaction: {
    id: string
    assinanteName: string
    parceiroName: string
    benefitName?: string
}) {
    return createAdminNotification({
        type: 'TRANSACTION',
        title: 'Nova Transação',
        message: `${transaction.assinanteName} usou benefício em ${transaction.parceiroName}${transaction.benefitName ? ` (${transaction.benefitName})` : ''}`,
        data: { transactionId: transaction.id },
        actionUrl: `/admin/transacoes`,
        priority: 'LOW'
    })
}

/**
 * Notificação: Assinatura Expirando (7 dias)
 */
export async function notifyExpiringSoon(assinante: {
    id: string
    name: string
    daysLeft: number
}) {
    return createAdminNotification({
        type: 'EXPIRING_SOON',
        title: 'Assinatura Expirando',
        message: `Assinatura de ${assinante.name} expira em ${assinante.daysLeft} dias`,
        data: { assinanteId: assinante.id },
        actionUrl: `/admin/assinantes/${assinante.id}`,
        priority: 'NORMAL'
    })
}

/**
 * Notificação: Assinatura Expira Hoje
 */
export async function notifyExpiringToday(assinante: {
    id: string
    name: string
}) {
    return createAdminNotification({
        type: 'EXPIRING_TODAY',
        title: 'Assinatura Vence Hoje',
        message: `Assinatura de ${assinante.name} vence hoje!`,
        data: { assinanteId: assinante.id },
        actionUrl: `/admin/assinantes/${assinante.id}`,
        priority: 'HIGH'
    })
}

/**
 * Notificação: Assinatura Expirada
 */
export async function notifyExpired(assinante: {
    id: string
    name: string
}) {
    return createAdminNotification({
        type: 'EXPIRED',
        title: 'Assinatura Expirada',
        message: `Assinatura de ${assinante.name} expirou`,
        data: { assinanteId: assinante.id },
        actionUrl: `/admin/assinantes/${assinante.id}`,
        priority: 'HIGH'
    })
}

/**
 * Notificação: Pagamento Recebido
 */
export async function notifyPaymentReceived(payment: {
    assinanteId?: string
    assinanteName: string
    value: number
}) {
    return createAdminNotification({
        type: 'PAYMENT_RECEIVED',
        title: 'Pagamento Confirmado',
        message: `Pagamento de R$ ${payment.value.toFixed(2)} de ${payment.assinanteName} confirmado`,
        data: { assinanteId: payment.assinanteId, value: payment.value },
        actionUrl: payment.assinanteId ? `/admin/assinantes/${payment.assinanteId}` : undefined,
        priority: 'NORMAL'
    })
}

/**
 * Notificação: Pagamento Falhou
 */
export async function notifyPaymentFailed(payment: {
    assinanteId?: string
    assinanteName: string
    reason?: string
}) {
    return createAdminNotification({
        type: 'PAYMENT_FAILED',
        title: 'Pagamento Falhou',
        message: `Pagamento de ${payment.assinanteName} falhou${payment.reason ? `: ${payment.reason}` : ''}`,
        data: { assinanteId: payment.assinanteId },
        actionUrl: payment.assinanteId ? `/admin/assinantes/${payment.assinanteId}` : undefined,
        priority: 'URGENT'
    })
}
