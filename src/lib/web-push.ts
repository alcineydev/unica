import webpush from 'web-push'

// Configurar VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contato@unicaclub.com.br'

console.log('[WEB-PUSH] Inicializando...')
console.log('[WEB-PUSH] VAPID Public Key:', vapidPublicKey ? 'presente' : 'AUSENTE')
console.log('[WEB-PUSH] VAPID Private Key:', vapidPrivateKey ? 'presente' : 'AUSENTE')

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
  console.log('[WEB-PUSH] VAPID configurado com sucesso')
} else {
  console.error('[WEB-PUSH] VAPID keys ausentes! Push não funcionará.')
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
  console.log('[WEB-PUSH] Enviando notificação para:', subscription.endpoint.substring(0, 50) + '...')

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

    console.log('[WEB-PUSH] Payload:', notificationPayload)

    const result = await webpush.sendNotification(pushSubscription, notificationPayload)
    console.log('[WEB-PUSH] Sucesso! Status:', result.statusCode)
    return true
  } catch (error: any) {
    console.error('[WEB-PUSH] Erro ao enviar push:', error.message)
    console.error('[WEB-PUSH] Status code:', error.statusCode)
    console.error('[WEB-PUSH] Body:', error.body)

    // Se subscription expirou ou foi cancelada
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('[WEB-PUSH] Subscription expirada/removida, marcando para exclusão')
      return false // Indicar para remover do banco
    }

    return false
  }
}

export { webpush }
