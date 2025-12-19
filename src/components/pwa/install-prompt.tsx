'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false)

  useEffect(() => {
    // Detectar se é mobile ou tablet
    const checkMobileOrTablet = () => {
      const userAgent = navigator.userAgent.toLowerCase()

      // Verificar por user agent
      const mobileKeywords = [
        'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry',
        'windows phone', 'opera mini', 'mobile', 'tablet'
      ]
      const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword))

      // Verificar por largura da tela (tablet até ~1024px)
      const isSmallScreen = window.innerWidth <= 1024

      // Verificar por touch
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // É mobile/tablet se: user agent indica OU (tela pequena E tem touch)
      return isMobileUA || (isSmallScreen && hasTouch)
    }

    const isMobile = checkMobileOrTablet()
    setIsMobileOrTablet(isMobile)

    // Se não for mobile/tablet, não continuar
    if (!isMobile) {
      console.log('[PWA] Desktop detectado - InstallPrompt desativado')
      return
    }

    // Verificar se já está instalado como PWA
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as any).standalone === true
      setIsStandalone(standalone)
      return standalone
    }

    if (checkStandalone()) {
      console.log('[PWA] App já instalado')
      return
    }

    // Detectar iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Verificar se já foi dispensado recentemente
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedAt = new Date(dismissed)
      const daysSinceDismissed = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) {
        console.log('[PWA] Prompt dispensado há menos de 7 dias')
        return
      }
    }

    // Listener para Android/Chrome
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      console.log('[PWA] beforeinstallprompt capturado')

      // Mostrar após 3 segundos
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Para iOS, mostrar instrução manual após 5 segundos
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 5000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      console.log('[PWA] Instalação:', outcome)

      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
    } catch (error) {
      console.error('[PWA] Erro na instalação:', error)
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
  }

  // Não mostrar se:
  // - Não é mobile/tablet
  // - Já instalado
  // - Não deve mostrar
  if (!isMobileOrTablet || isStandalone || !showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Instalar UNICA</h3>
              {isIOS ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Toque em{' '}
                  <span className="inline-flex items-center mx-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" transform="rotate(180 10 10)" />
                    </svg>
                  </span>
                  {' '}e "Adicionar à Tela Inicial"
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  Acesse rápido direto da tela inicial
                </p>
              )}
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-muted rounded shrink-0"
              aria-label="Fechar"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {!isIOS && deferredPrompt && (
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleDismiss}
              >
                Agora não
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleInstall}
              >
                <Download className="h-4 w-4 mr-1" />
                Instalar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
