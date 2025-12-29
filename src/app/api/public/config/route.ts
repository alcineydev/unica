import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Buscar configurações globais
    const configRecord = await prisma.config.findFirst({
      where: { key: 'global' }
    })

    // Buscar configurações do sistema (cores do tema)
    const systemConfigs = await prisma.systemConfig.findMany({
      where: {
        category: 'theme'
      }
    })

    // Converter para objeto key-value
    const themeColors: Record<string, string> = {}
    systemConfigs.forEach(config => {
      themeColors[config.key] = config.value || ''
    })

    // Retornar apenas campos públicos - cast via unknown para satisfazer TypeScript
    const config = (configRecord?.value as unknown as Record<string, unknown>) || {}

    return NextResponse.json({
      config: {
        siteName: config.siteName,
        siteDescription: config.siteDescription,
        logo: config.logo,
        whatsapp: config.whatsapp,
        email: config.email,
        phone: config.phone,
        instagram: config.instagram,
        facebook: config.facebook
      },
      // Cores do tema
      color_primary: themeColors.color_primary,
      color_primary_light: themeColors.color_primary_light,
      color_secondary: themeColors.color_secondary,
      color_accent: themeColors.color_accent,
      color_background_dark: themeColors.color_background_dark,
      color_background_light: themeColors.color_background_light,
      color_text_dark: themeColors.color_text_dark,
      color_text_light: themeColors.color_text_light
    })

  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json({ config: null })
  }
}
