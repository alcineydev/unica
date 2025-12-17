'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, CameraOff, RefreshCw, Loader2 } from 'lucide-react'

interface QRCodeScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
}

export function QRCodeScanner({ onScan, onError }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  async function startScanning() {
    setError(null)
    setIsStarting(true)
    
    try {
      // Pequeno delay para garantir que o DOM está pronto
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Limpar scanner anterior se existir
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop()
          scannerRef.current.clear()
        } catch {
          // Ignorar erros ao limpar
        }
      }
      
      const html5QrCode = new Html5Qrcode('qr-reader')
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // QR Code lido com sucesso
          console.log('[QR] Código lido:', decodedText)
          onScan(decodedText)
          stopScanning()
        },
        () => {
          // Ignorar erros de frame sem QR (normal)
        }
      )

      setIsScanning(true)
      console.log('[QR] Scanner iniciado com sucesso')
    } catch (err) {
      console.error('[QR] Erro ao iniciar scanner:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao acessar câmera'
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setError('Permissão de câmera negada. Permita o acesso nas configurações do navegador.')
      } else if (errorMessage.includes('NotFoundError')) {
        setError('Nenhuma câmera encontrada no dispositivo.')
      } else if (errorMessage.includes('NotReadableError')) {
        setError('Câmera em uso por outro aplicativo.')
      } else {
        setError(`Erro: ${errorMessage}`)
      }
      
      onError?.(errorMessage)
    } finally {
      setIsStarting(false)
    }
  }

  async function stopScanning() {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
        scannerRef.current.clear()
      } catch (err) {
        console.error('[QR] Erro ao parar scanner:', err)
      }
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {/* Container do Scanner - sempre visível mas com altura controlada */}
          <div
            id="qr-reader"
            className={`w-full bg-zinc-900 ${isScanning || isStarting ? 'min-h-[300px]' : 'h-0 overflow-hidden'}`}
          />

          {/* Placeholder quando não está escaneando */}
          {!isScanning && !isStarting && (
            <div className="w-full aspect-square bg-zinc-900 flex flex-col items-center justify-center p-6">
              {error ? (
                <>
                  <CameraOff className="h-16 w-16 text-red-500/60 mb-4" />
                  <p className="text-red-400 text-center text-sm mb-4">{error}</p>
                  <Button onClick={startScanning} variant="outline" className="text-white border-zinc-600">
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
                  <Button onClick={startScanning} className="bg-purple-600 hover:bg-purple-700">
                    <Camera className="h-4 w-4 mr-2" />
                    Iniciar Câmera
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Loading */}
          {isStarting && !isScanning && (
            <div className="w-full aspect-square bg-zinc-900 flex flex-col items-center justify-center p-6">
              <Loader2 className="h-16 w-16 text-purple-500 mb-4 animate-spin" />
              <p className="text-zinc-400 text-center text-sm">
                Acessando câmera...
              </p>
            </div>
          )}

          {/* Overlay com frame de QR quando escaneando */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-purple-500 rounded-lg relative">
                  {/* Cantos decorativos */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-purple-500 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-purple-500 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-purple-500 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-purple-500 rounded-br-lg" />
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
              onClick={stopScanning}
              variant="outline"
              className="w-full border-zinc-600 text-white hover:bg-zinc-800"
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
