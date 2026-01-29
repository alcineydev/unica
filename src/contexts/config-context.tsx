'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

interface LogoConfig {
  type: 'image' | 'text'
  imageLight: string | null
  imageDark: string | null
  text: string
  size: 'small' | 'medium' | 'large'
}

interface SystemConfig {
  // Logo
  logo: LogoConfig
  favicon: string | null
  // Identidade
  siteName: string
  siteDescription: string
  primaryColor: string
  // Contato
  contactEmail: string
  contactPhone: string
  contactWhatsapp: string
  address: string
  // Social
  socialFacebook: string
  socialInstagram: string
  socialLinkedin: string
}

interface ConfigContextType {
  config: SystemConfig
  isLoading: boolean
  refetch: () => Promise<void>
}

const defaultLogo: LogoConfig = {
  type: 'text',
  imageLight: null,
  imageDark: null,
  text: 'UNICA',
  size: 'medium'
}

const defaultConfig: SystemConfig = {
  logo: defaultLogo,
  favicon: null,
  siteName: 'UNICA - Clube de Benefícios',
  siteDescription: 'Seu clube de benefícios e descontos exclusivos',
  primaryColor: '#2563eb',
  contactEmail: '',
  contactPhone: '',
  contactWhatsapp: '',
  address: '',
  socialFacebook: '',
  socialInstagram: '',
  socialLinkedin: ''
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(true)

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/public/config')
      if (response.ok) {
        const data = await response.json()
        // Garantir que logo tenha a estrutura correta
        const logoData = data.logo || {}
        setConfig({
          ...defaultConfig,
          ...data,
          logo: {
            type: logoData.type || 'text',
            imageLight: logoData.imageLight || null,
            imageDark: logoData.imageDark || null,
            text: logoData.text || 'UNICA',
            size: logoData.size || 'medium'
          }
        })
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const refetch = useCallback(async () => {
    setIsLoading(true)
    await fetchConfig()
  }, [fetchConfig])

  return (
    <ConfigContext.Provider value={{ config, isLoading, refetch }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig deve ser usado dentro de um ConfigProvider')
  }
  return context
}

// Helper para tamanho do logo em pixels
export function getLogoSize(size: 'small' | 'medium' | 'large'): number {
  switch (size) {
    case 'small': return 28
    case 'medium': return 36
    case 'large': return 44
    default: return 36
  }
}

// Exportar tipos para uso em outros arquivos
export type { LogoConfig, SystemConfig }
