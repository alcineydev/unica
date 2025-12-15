import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const configRecord = await prisma.config.findFirst({
      where: { key: 'global' }
    })

    // Retornar apenas campos públicos
    const config = configRecord?.value as Record<string, unknown> || {}
    
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
      }
    })

  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json({ config: null })
  }
}

