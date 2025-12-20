import webpush from 'web-push'

// Configurar VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contato@unicaclub.com.br'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
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
): Promise<boolean> {
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
    return true
  } catch (error: any) {
    console.error('Erro ao enviar push:', error)

    // Se subscription expirou ou foi cancelada
    if (error.statusCode === 410 || error.statusCode === 404) {
      return false // Indicar para remover do banco
    }

    return false
  }
}

export { webpush }
