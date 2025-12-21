import webpush from 'web-push'

// Fallback hardcoded para quando env vars nao estao disponiveis
const FALLBACK_PUBLIC_KEY = 'BDgxbvXNieDaGmEvQxgwa1GQSt_4Fq-NjC2VwHmXp0dIXVLwKXNOEzg6GH1kEX6bAt9DGSBh_HCS1ebaIUsRQYM'
const FALLBACK_PRIVATE_KEY = 'F9HKk763mSWxEirD2zWTs7f8naxuyR_egRFwjkpGOH4'
const FALLBACK_SUBJECT = 'mailto:unicabeneficios.com.br@gmail.com'

// Funcao para obter VAPID keys dinamicamente (com fallback)
function getVapidKeys() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || FALLBACK_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY || FALLBACK_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || FALLBACK_SUBJECT

  return {
    publicKey,
    privateKey,
    subject,
    usingFallback: !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  }
}

// Configurar VAPID sob demanda
let isConfigured = false
function ensureConfigured(): boolean {
  if (isConfigured) return true

  const keys = getVapidKeys()
  console.log('[WEB-PUSH] Verificando config:', {
    hasPublic: !!keys.publicKey,
    hasPrivate: !!keys.privateKey,
    usingFallback: keys.usingFallback,
    publicPreview: keys.publicKey?.substring(0, 20)
  })

  if (keys.publicKey && keys.privateKey) {
    try {
      webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey)
      isConfigured = true
      console.log('[WEB-PUSH] VAPID configurado com sucesso')
      return true
    } catch (error) {
      console.error('[WEB-PUSH] Erro ao configurar VAPID:', error)
      return false
    }
  }

  console.warn('[WEB-PUSH] VAPID keys nao encontradas')
  return false
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
  if (!ensureConfigured()) {
    console.error('[WEB-PUSH] VAPID nao configurado')
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
  const keys = getVapidKeys()
  return keys.publicKey || null
}

export function isWebPushConfigured(): boolean {
  return ensureConfigured()
}

export { webpush }
