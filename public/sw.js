const CACHE_NAME = 'unica-v2'
const OFFLINE_URL = '/offline'

// Arquivos para cache inicial
const PRECACHE_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
  '/icons/icon.svg'
]

// Instalação
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache aberto')
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.log('[SW] Erro ao cachear:', err)
      })
    })
  )
  self.skipWaiting()
})

// Ativação - limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Removendo cache antigo:', name)
            return caches.delete(name)
          })
      )
    })
  )
  self.clients.claim()
})

// Fetch - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Ignorar requests não-GET e APIs
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('/api/')) return

  // Para navegação, tenta rede primeiro
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cachear resposta bem-sucedida
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
          return response
        })
        .catch(() => {
          // Fallback para cache ou página offline
          return caches.match(event.request)
            .then((cached) => cached || caches.match('/login'))
        })
    )
    return
  }

  // Para outros recursos (assets), cache first
  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) return cached

        return fetch(event.request)
          .then((response) => {
            // Só cacheia respostas válidas
            if (response.status === 200) {
              const responseClone = response.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone)
              })
            }
            return response
          })
          .catch(() => null)
      })
  )
})

// Push notifications (preparado para futuro)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  
  const options = {
    body: data.body || 'Nova notificação da UNICA',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: data.actions || []
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'UNICA', options)
  )
})

// Ação ao clicar na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const url = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já tem uma janela aberta, foca nela
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        // Senão, abre nova janela
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})
