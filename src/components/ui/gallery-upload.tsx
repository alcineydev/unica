'use client'

import { useState, useRef } from 'react'
import { X, Loader2, Plus } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface GalleryUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  folder?: string
  maxImages?: number
  className?: string
  disabled?: boolean
}

export function GalleryUpload({
  value = [],
  onChange,
  folder = 'gallery',
  maxImages = 10,
  className = '',
  disabled = false
}: GalleryUploadProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (value.length + files.length > maxImages) {
      setError(`Máximo de ${maxImages} imagens permitidas`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()
        return response.ok ? data.url : null
      })

      const results = await Promise.all(uploadPromises)
      const successfulUploads = results.filter((url): url is string => url !== null)

      if (successfulUploads.length > 0) {
        onChange([...value, ...successfulUploads])
      }

      if (successfulUploads.length < files.length) {
        setError(`${files.length - successfulUploads.length} arquivo(s) falharam`)
      }
    } catch (err) {
      console.error('Erro:', err)
      setError('Erro ao fazer upload')
    } finally {
      setIsLoading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleRemove = (index: number) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange(newValue)
    setError(null)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {value.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
            <Image
              src={url}
              alt={`Galeria ${index + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        
        {value.length < maxImages && !disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
            className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-muted/50 transition-colors cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Plus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Adicionar</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleUpload}
        className="hidden"
        disabled={disabled || isLoading}
      />

      <p className="text-xs text-muted-foreground">
        {value.length}/{maxImages} imagens • JPG, PNG, WebP ou GIF • Máx 5MB cada
      </p>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

