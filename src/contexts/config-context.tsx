'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

interface SystemConfig {
  siteName: string
  siteDescription: string
  logo: string | null
  favicon: string | null
  email: string
  phone: string
  whatsapp: string
  address: string
  instagram: string
  facebook: string
  website: string
}

interface ConfigContextType {
  config: SystemConfig
  isLoading: boolean
  refetch: () => Promise<void>
}

const defaultConfig: SystemConfig = {
  siteName: 'UNICA - Clube de Benefícios',
  siteDescription: 'Seu clube de benefícios e descontos exclusivos',
  logo: null,
  favicon: null,
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  instagram: '',
  facebook: '',
  website: ''
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
        setConfig(data)
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
