'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, CameraOff, Loader2, AlertCircle, RefreshCw } from 'lucide-react'

interface QRCodeScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
}

export function QRCodeScanner({ onScan, onError }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const mountedRef = useRef(true)
  const containerIdRef = useRef(`qr-reader-${Date.now()}`)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState()
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop()
        }
        scannerRef.current.clear()
      } catch (err) {
        console.error('[SCANNER] Erro ao parar:', err)
      }
      scannerRef.current = null
    }
    if (mountedRef.current) {
      setIsScanning(false)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stopScanner()
    }
  }, [stopScanner])

  const startScanner = async () => {
    setError(null)
    setIsLoading(true)

    try {
      // Limpar scanner anterior se existir
      await stopScanner()

      // Pequeno delay para garantir cleanup e DOM ready
      await new Promise(resolve => setTimeout(resolve, 200))

      // Verificar se o elemento existe
      const element = document.getElementById(containerIdRef.current)
      if (!element) {
        throw new Error('Elemento do scanner não encontrado')
      }

      // Criar nova instância
      scannerRef.current = new Html5Qrcode(containerIdRef.current)

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          console.log('[SCANNER] QR Code detectado:', decodedText)

          // Chamar callback
          onScan(decodedText)

          // Parar scanner após leitura bem-sucedida
          stopScanner()
        },
        () => {
          // Ignorar erros de frame sem QR code
          // Esses são normais durante o escaneamento
        }
      )

      if (mountedRef.current) {
        setIsScanning(true)
        setIsLoading(false)
        console.log('[SCANNER] Iniciado com sucesso')
      }
    } catch (err: unknown) {
      console.error('[SCANNER] Erro ao iniciar:', err)

      let errorMessage = 'Erro ao acessar a câmera'
      const errorStr = err instanceof Error ? err.message : String(err)

      if (errorStr.includes('NotAllowed') || errorStr.includes('Permission')) {
        errorMessage = 'Permissão de câmera negada. Por favor, permita o acesso nas configurações do navegador.'
      } else if (errorStr.includes('NotFound') || errorStr.includes('No camera')) {
        errorMessage = 'Nenhuma câmera encontrada no dispositivo.'
      } else if (errorStr.includes('NotReadable') || errorStr.includes('already in use')) {
        errorMessage = 'Câmera em uso por outro aplicativo.'
      } else if (errorStr.includes('OverconstrainedError')) {
        errorMessage = 'Configuração de câmera não suportada.'
      }

      if (mountedRef.current) {
        setError(errorMessage)
        setIsLoading(false)
        setIsScanning(false)
      }

      onError?.(errorMessage)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {/* Container do Scanner - sempre com altura mínima para o DOM existir */}
          <div
            id={containerIdRef.current}
            className="w-full bg-zinc-900 rounded-t-lg overflow-hidden"
            style={{ minHeight: isScanning || isLoading ? '300px' : '0px', height: isScanning || isLoading ? 'auto' : '0px' }}
          />

          {/* Placeholder quando não está escaneando */}
          {!isScanning && !isLoading && (
            <div className="w-full aspect-square bg-zinc-900 flex flex-col items-center justify-center p-6 rounded-t-lg">
              {error ? (
                <>
                  <AlertCircle className="h-16 w-16 text-red-500/60 mb-4" />
                  <p className="text-red-400 text-center text-sm mb-4 max-w-xs">{error}</p>
                  <Button
                    onClick={startScanner}
                    variant="outline"
                    className="text-white border-zinc-600 hover:bg-zinc-800"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </>
              ) : (
                <>
                  <Camera className="h-16 w-16 text-zinc-600 mb-4" />
                  <p className="text-zinc-400 text-center text-sm mb-4">
                    Clique para iniciar o scanner
                  </p>
                  <Button
                    onClick={startScanner}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Iniciar Câmera
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Loading */}
          {isLoading && !isScanning && (
            <div className="absolute inset-0 w-full bg-zinc-900 flex flex-col items-center justify-center p-6">
              <Loader2 className="h-16 w-16 text-primary mb-4 animate-spin" />
              <p className="text-zinc-400 text-center text-sm">
                Iniciando câmera...
              </p>
            </div>
          )}

          {/* Overlay com frame de QR quando escaneando */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-primary rounded-lg relative">
                  {/* Cantos decorativos */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                </div>
              </div>

              {/* Texto de instrução */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white text-sm bg-black/50 inline-block px-4 py-2 rounded-full">
                  Aponte para o QR Code do cliente
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botão de parar */}
        {isScanning && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-950">
            <Button
              onClick={stopScanner}
              variant="destructive"
              className="w-full"
            >
              <CameraOff className="h-4 w-4 mr-2" />
              Parar Scanner
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default QRCodeScanner
