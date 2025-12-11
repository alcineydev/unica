'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, CameraOff, RefreshCw } from 'lucide-react'

interface QRCodeScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
}

export function QRCodeScanner({ onScan, onError }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  async function startScanning() {
    if (!containerRef.current) return

    setError(null)
    
    try {
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
          onScan(decodedText)
          stopScanning()
        },
        (errorMessage) => {
          // Erro durante a leitura (normal enquanto procura)
          // Não mostrar erro para cada frame sem QR
        }
      )

      setIsScanning(true)
      setHasPermission(true)
    } catch (err) {
      console.error('Erro ao iniciar scanner:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao acessar câmera'
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setHasPermission(false)
        setError('Permissão de câmera negada. Por favor, permita o acesso à câmera.')
      } else if (errorMessage.includes('NotFoundError')) {
        setError('Nenhuma câmera encontrada no dispositivo.')
      } else {
        setError('Erro ao iniciar o scanner. Tente novamente.')
      }
      
      onError?.(errorMessage)
    }
  }

  async function stopScanning() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (err) {
        console.error('Erro ao parar scanner:', err)
      }
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {/* Container do Scanner */}
          <div
            id="qr-reader"
            ref={containerRef}
            className={`w-full aspect-square bg-zinc-900 ${!isScanning ? 'hidden' : ''}`}
          />

          {/* Placeholder quando não está escaneando */}
          {!isScanning && (
            <div className="w-full aspect-square bg-zinc-900 flex flex-col items-center justify-center p-6">
              {error ? (
                <>
                  <CameraOff className="h-16 w-16 text-zinc-600 mb-4" />
                  <p className="text-zinc-400 text-center text-sm mb-4">{error}</p>
                  <Button onClick={startScanning} variant="outline">
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

          {/* Overlay com frame de QR */}
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
          <div className="p-4 border-t bg-zinc-950">
            <Button
              onClick={stopScanning}
              variant="outline"
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

