'use client'

import { useConfig, getLogoSize } from '@/contexts/config-context'
import { cn } from '@/lib/utils'

interface LogoDisplayProps {
  variant?: 'light' | 'dark' | 'auto'
  className?: string
  showText?: boolean
  size?: 'small' | 'medium' | 'large' | 'custom'
  customSize?: number
  textClassName?: string
}

export function LogoDisplay({ 
  variant = 'auto', 
  className,
  showText = true,
  size = 'custom',
  customSize,
  textClassName
}: LogoDisplayProps) {
  const { config, isLoading } = useConfig()
  const logo = config.logo

  // Determinar tamanho
  const logoSize = customSize || (size === 'custom' ? getLogoSize(logo.size) : getLogoSize(size))
  
  // Determinar qual imagem usar baseado no variant
  const getImageUrl = () => {
    if (variant === 'light') return logo.imageLight
    if (variant === 'dark') return logo.imageDark || logo.imageLight
    // Auto: usar light por padrão
    return logo.imageLight
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div 
          className="animate-pulse bg-gray-200 rounded-xl"
          style={{ width: logoSize, height: logoSize }}
        />
        {showText && (
          <div className="animate-pulse bg-gray-200 rounded h-5 w-20" />
        )}
      </div>
    )
  }

  // Renderizar baseado no tipo
  if (logo.type === 'image' && getImageUrl()) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <img 
          src={getImageUrl()!} 
          alt={config.siteName}
          className="object-contain rounded-xl"
          style={{ width: logoSize, height: logoSize }}
        />
        {showText && (
          <span 
            className={cn("font-bold truncate", textClassName)}
            style={{ fontSize: Math.max(logoSize * 0.45, 14) }}
          >
            {logo.text || config.siteName?.split(' - ')[0] || 'UNICA'}
          </span>
        )}
      </div>
    )
  }

  // Tipo texto ou fallback
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div 
        className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
        style={{ 
          width: logoSize, 
          height: logoSize,
          fontSize: logoSize * 0.45
        }}
      >
        {(logo.text || config.siteName || 'U').charAt(0).toUpperCase()}
      </div>
      {showText && (
        <span 
          className={cn("font-bold truncate", textClassName)}
          style={{ fontSize: Math.max(logoSize * 0.45, 14) }}
        >
          {logo.text || config.siteName?.split(' - ')[0] || 'UNICA'}
        </span>
      )}
    </div>
  )
}
