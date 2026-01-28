import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Cache para evitar muitas consultas ao banco
let configCache: Record<string, unknown> | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60 * 1000 // 1 minuto

interface PublicConfig {
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

const defaultConfig: PublicConfig = {
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

export async function GET() {
  try {
    const now = Date.now()
    
    // Retornar do cache se ainda válido
    if (configCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json(configCache)
    }

    // Buscar configuração do banco
    const config = await prisma.config.findFirst({
      where: { key: 'global' }
    })

    if (!config) {
      return NextResponse.json(defaultConfig)
    }

    // Parse do valor JSON
    let configData: Partial<PublicConfig> = {}
    try {
      configData = JSON.parse(config.value)
    } catch {
      configData = {}
    }

    // Estruturar resposta com valores públicos
    const publicConfig: PublicConfig = {
      siteName: configData.siteName || defaultConfig.siteName,
      siteDescription: configData.siteDescription || defaultConfig.siteDescription,
      logo: configData.logo || null,
      favicon: configData.favicon || null,
      email: configData.email || '',
      phone: configData.phone || '',
      whatsapp: configData.whatsapp || '',
      address: configData.address || '',
      instagram: configData.instagram || '',
      facebook: configData.facebook || '',
      website: configData.website || ''
    }

    // Atualizar cache
    configCache = publicConfig
    cacheTimestamp = now

    return NextResponse.json(publicConfig)
  } catch (error) {
    console.error('[PUBLIC CONFIG] Erro:', error)
    return NextResponse.json(defaultConfig)
  }
}

// Função para invalidar cache (chamada após salvar config)
export function invalidateConfigCache() {
  configCache = null
  cacheTimestamp = 0
}
