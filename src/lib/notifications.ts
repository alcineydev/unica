import prisma from '@/lib/prisma'
import webpush from 'web-push'

// Configurar web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@unicabeneficios.com.br'

// Flag para saber se VAPID está configurado
let vapidConfigured = false

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
    vapidConfigured = true
    console.log('[Notifications] ✅ VAPID configurado com sucesso')
  } catch (error) {
    console.error('[Notifications] ❌ Erro ao configurar VAPID:', error)
  }
} else {
  console.warn('[Notifications] ⚠️ VAPID keys NÃO configuradas!')
  console.warn('[Notifications] NEXT_PUBLIC_VAPID_PUBLIC_KEY:', vapidPublicKey ? 'presente' : 'AUSENTE')
  console.warn('[Notifications] VAPID_PRIVATE_KEY:', vapidPrivateKey ? 'presente' : 'AUSENTE')
}

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
}

/**
 * Envia notificação push para todos os admins ativos
 */
export async function notifyAdmins(payload: NotificationPayload) {
  console.log('[Notifications] notifyAdmins chamado:', payload.title)

  // Verificar se VAPID está configurado
  if (!vapidConfigured) {
    console.error('[Notifications] ❌ VAPID não configurado - push notifications desativadas')
    return { sent: 0, failed: 0, error: 'VAPID not configured' }
  }

  try {
    // Buscar todos os admins ativos com push subscriptions
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'DEVELOPER'] },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        pushSubscriptions: true,
      },
    })

    console.log('[Notifications] Admins encontrados:', admins.length)

    // Filtrar admins que têm subscriptions
    const adminsWithSubs = admins.filter(a => a.pushSubscriptions && a.pushSubscriptions.length > 0)

    console.log('[Notifications] Admins com push subscription:', adminsWithSubs.length)

    // Log detalhado de cada admin
    admins.forEach(admin => {
      console.log(`[Notifications] Admin ${admin.email}: ${admin.pushSubscriptions?.length || 0} subscriptions`)
    })

    if (adminsWithSubs.length === 0) {
      console.log('[Notifications] Nenhum admin com push subscription encontrado')
      return { sent: 0, failed: 0 }
    }

    let sent = 0
    let failed = 0

    for (const admin of adminsWithSubs) {
      for (const sub of admin.pushSubscriptions) {
        try {
          console.log(`[Notifications] Enviando push para ${admin.email} (${sub.endpoint.substring(0, 50)}...)`)

          const subscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          }

          await webpush.sendNotification(
            subscription,
            JSON.stringify({
              title: payload.title,
              body: payload.body,
              icon: payload.icon || '/icons/icon-192x192.png',
              badge: payload.badge || '/icons/badge-72x72.png',
              tag: payload.tag || 'unica-notification',
              data: payload.data || {},
            })
          )

          sent++
          console.log(`[Notifications] ✅ Push enviado com sucesso para ${admin.email}`)
        } catch (error) {
          failed++
          const err = error as { statusCode?: number; message?: string }
          console.error(`[Notifications] ❌ Erro ao enviar push para ${admin.email}:`, err.message || error)

          // Se subscription expirou (410 Gone), remover do banco
          if (err.statusCode === 410) {
            console.log(`[Notifications] Removendo subscription expirada de ${admin.email}`)
            await prisma.pushSubscription.delete({
              where: { id: sub.id },
            }).catch((e: unknown) => console.error('Erro ao deletar subscription:', e))
          }
        }
      }
    }

    console.log(`[Notifications] Resultado: ${sent} enviados, ${failed} falharam`)
    return { sent, failed }
  } catch (error) {
    console.error('[Notifications] Erro geral em notifyAdmins:', error)
    return { sent: 0, failed: 0, error: String(error) }
  }
}

/**
 * Cria notificação no banco para exibir no painel
 */
export async function createAdminNotification(data: {
  type: 'NEW_SUBSCRIBER' | 'PAYMENT_CONFIRMED' | 'PAYMENT_OVERDUE' | 'TRANSACTION' | 'SYSTEM'
  title: string
  message: string
  link?: string
  metadata?: Record<string, unknown>
}) {
  try {
    // Buscar todos os admins ativos
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'DEVELOPER'] },
        isActive: true,
      },
      select: { id: true },
    })

    // Criar notificação para cada admin
    await prisma.panelNotification.createMany({
      data: admins.map((admin: { id: string }) => ({
        userId: admin.id,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        read: false,
      })),
    })

    console.log(`[Notifications] Notificação criada para ${admins.length} admins`)
  } catch (error) {
    console.error('[Notifications] Erro ao criar notificação:', error)
  }
}

/**
 * Notifica admins sobre novo assinante
 */
export async function notifyNewSubscriber(assinante: {
  id: string
  name: string
  email?: string
  planName?: string
}) {
  console.log('[Notifications] notifyNewSubscriber chamado para:', assinante.name)

  const title = 'Novo Assinante!'
  const body = `${assinante.name} acabou de se cadastrar${assinante.planName ? ` no plano ${assinante.planName}` : ''}`

  // Enviar push
  const pushResult = await notifyAdmins({
    title,
    body,
    tag: `new-subscriber-${assinante.id}`,
    data: {
      type: 'NEW_SUBSCRIBER',
      assinanteId: assinante.id,
      url: '/admin/assinantes',
    },
  })

  // Criar notificação no painel
  await createAdminNotification({
    type: 'NEW_SUBSCRIBER',
    title,
    message: body,
    link: '/admin/assinantes',
    metadata: {
      assinanteId: assinante.id,
      assinanteName: assinante.name,
      planName: assinante.planName,
    },
  })

  return { push: pushResult, panel: true }
}

/**
 * Notifica admins sobre pagamento confirmado
 */
export async function notifyPaymentConfirmed(data: {
  assinanteId: string
  assinanteName: string
  planName: string
  value: number
  billingType: string
}) {
  console.log('[Notifications] notifyPaymentConfirmed chamado para:', data.assinanteName)

  const title = 'Pagamento Confirmado!'
  const body = `${data.assinanteName} pagou R$ ${data.value.toFixed(2).replace('.', ',')} (${data.planName})`

  // Enviar push
  const pushResult = await notifyAdmins({
    title,
    body,
    tag: `payment-${data.assinanteId}-${Date.now()}`,
    data: {
      type: 'PAYMENT_CONFIRMED',
      assinanteId: data.assinanteId,
      url: '/admin/assinantes',
    },
  })

  // Criar notificação no painel
  await createAdminNotification({
    type: 'PAYMENT_CONFIRMED',
    title,
    message: body,
    link: '/admin/assinantes',
    metadata: {
      assinanteId: data.assinanteId,
      assinanteName: data.assinanteName,
      planName: data.planName,
      value: data.value,
      billingType: data.billingType,
    },
  })

  return { push: pushResult, panel: true }
}
