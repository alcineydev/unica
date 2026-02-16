'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X, Loader2, Upload } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ImageCropper } from './image-cropper'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  folder?: string
  aspectRatio?: 'square' | 'banner' | 'destaque' | 'video'
  className?: string
  placeholder?: string
  disabled?: boolean
  enableCrop?: boolean
}

const aspectRatioValues = {
  square: 1,
  banner: 4,
  destaque: 2.5,
  video: 16 / 9
}

export function ImageUpload({
  value,
  onChange,
  folder = 'general',
  aspectRatio = 'square',
  className = '',
  placeholder = 'Clique para fazer upload',
  disabled = false,
  enableCrop = true
}: ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cropImage, setCropImage] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const aspectClasses = {
    square: 'aspect-square',
    banner: 'aspect-[4/1]',
    destaque: 'aspect-[2.5/1]',
    video: 'aspect-video'
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de arquivo não permitido. Use: JPG, PNG, WebP ou GIF')
      return
    }

    // Validar tamanho
    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo: 5MB')
      return
    }

    if (enableCrop) {
      // Mostrar cropper
      const reader = new FileReader()
      reader.onload = () => {
        setCropImage(reader.result as string)
        setShowCropper(true)
      }
      reader.readAsDataURL(file)
    } else {
      // Upload direto
      uploadFile(file)
    }

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false)
    setCropImage(null)
    
    const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' })
    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok && data.url) {
        onChange(data.url)
      } else {
        setError(data.error || 'Erro ao fazer upload')
      }
    } catch (err) {
      console.error('Erro:', err)
      setError('Erro ao fazer upload')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = () => {
    onChange(null)
    setError(null)
  }

  return (
    <>
      <div className={cn('relative', aspectClasses[aspectRatio], className)}>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isLoading}
        />
        
        {value ? (
          <div className="relative w-full h-full rounded-lg overflow-hidden border border-border">
            <Image
              src={value}
              alt="Upload"
              fill
              className="object-cover"
              unoptimized
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1.5 rounded-full hover:bg-destructive/90 transition-colors shadow-md"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || isLoading}
            className={cn(
              "w-full h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors",
              disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-muted/50 cursor-pointer"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Enviando...</span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground text-center px-2">{placeholder}</span>
              </>
            )}
          </button>
        )}
        
        {error && (
          <p className="absolute -bottom-6 left-0 text-xs text-destructive">{error}</p>
        )}
      </div>

      {showCropper && cropImage && (
        <ImageCropper
          imageSrc={cropImage}
          open={showCropper}
          onClose={() => {
            setShowCropper(false)
            setCropImage(null)
          }}
          onCropComplete={handleCropComplete}
          aspectRatio={aspectRatioValues[aspectRatio]}
          circularCrop={aspectRatio === 'square'}
        />
      )}
    </>
  )
}
