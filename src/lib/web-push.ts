import webpush from 'web-push'

// Configurar VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contato@unicaclub.com.br'

let isConfigured = false

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
    isConfigured = true
  } catch (error) {
    console.error('[WEB-PUSH] Erro ao configurar VAPID:', error)
  }
}

export interface PushPayload {
  title: string
  message: string
  icon?: string
  badge?: string
  link?: string
  tag?: string
}

export async function sendPushNotification(
  subscription: {
    endpoint: string
    p256dh: string
    auth: string
  },
  payload: PushPayload
): Promise<{ success: boolean; expired?: boolean }> {
  if (!isConfigured) {
    console.error('[WEB-PUSH] VAPID não configurado')
    return { success: false }
  }

  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.message,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      data: {
        url: payload.link || '/'
      },
      tag: payload.tag || 'default'
    })

    await webpush.sendNotification(pushSubscription, notificationPayload)
    return { success: true }
  } catch (error: any) {
    console.error('[WEB-PUSH] Erro ao enviar:', error.message)

    // Se subscription expirou ou foi cancelada (410 Gone ou 404 Not Found)
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, expired: true }
    }

    return { success: false }
  }
}

export function getVapidPublicKey(): string | null {
  return vapidPublicKey || null
}

export function isWebPushConfigured(): boolean {
  return isConfigured
}

export { webpush }
