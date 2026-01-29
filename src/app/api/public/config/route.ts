import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface LogoConfig {
  type: 'image' | 'text'
  imageLight: string | null
  imageDark: string | null
  text: string
  size: 'small' | 'medium' | 'large'
}

interface PublicConfig {
  logo: LogoConfig
  favicon: string | null
  siteName: string
  siteDescription: string
  primaryColor: string
  contactEmail: string
  contactPhone: string
  contactWhatsapp: string
  address: string
  socialFacebook: string
  socialInstagram: string
  socialLinkedin: string
}

let configCache: PublicConfig | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60 * 1000

const defaultLogo: LogoConfig = {
  type: 'text',
  imageLight: null,
  imageDark: null,
  text: 'UNICA',
  size: 'medium'
}

const defaultConfig: PublicConfig = {
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

export async function GET() {
  try {
    const now = Date.now()
    
    if (configCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json(configCache)
    }

    const config = await prisma.config.findFirst({
      where: { key: 'global' }
    })

    if (!config) {
      return NextResponse.json(defaultConfig)
    }

    let configData: Record<string, unknown> = {}
    try {
      configData = JSON.parse(config.value)
    } catch {
      configData = {}
    }

    const logoData = (configData.logo as Record<string, unknown>) || {}
    
    const publicConfig: PublicConfig = {
      logo: {
        type: (logoData.type as 'image' | 'text') || 'text',
        imageLight: (logoData.imageLight as string) || null,
        imageDark: (logoData.imageDark as string) || null,
        text: (logoData.text as string) || 'UNICA',
        size: (logoData.size as 'small' | 'medium' | 'large') || 'medium'
      },
      favicon: (configData.favicon as string) || null,
      siteName: (configData.siteName as string) || defaultConfig.siteName,
      siteDescription: (configData.siteDescription as string) || defaultConfig.siteDescription,
      primaryColor: (configData.primaryColor as string) || defaultConfig.primaryColor,
      contactEmail: (configData.contactEmail as string) || '',
      contactPhone: (configData.contactPhone as string) || '',
      contactWhatsapp: (configData.contactWhatsapp as string) || '',
      address: (configData.address as string) || '',
      socialFacebook: (configData.socialFacebook as string) || '',
      socialInstagram: (configData.socialInstagram as string) || '',
      socialLinkedin: (configData.socialLinkedin as string) || ''
    }

    configCache = publicConfig
    cacheTimestamp = now

    return NextResponse.json(publicConfig)
  } catch (error) {
    console.error('[PUBLIC CONFIG] Erro:', error)
    return NextResponse.json(defaultConfig)
  }
}
