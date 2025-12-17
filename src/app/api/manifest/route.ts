import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const config = await prisma.pWAConfig.findFirst()

    const icons = []
    
    if (config?.icon72) icons.push({ src: config.icon72, sizes: '72x72', type: 'image/png', purpose: 'maskable any' })
    if (config?.icon96) icons.push({ src: config.icon96, sizes: '96x96', type: 'image/png', purpose: 'maskable any' })
    if (config?.icon128) icons.push({ src: config.icon128, sizes: '128x128', type: 'image/png', purpose: 'maskable any' })
    if (config?.icon144) icons.push({ src: config.icon144, sizes: '144x144', type: 'image/png', purpose: 'maskable any' })
    if (config?.icon152) icons.push({ src: config.icon152, sizes: '152x152', type: 'image/png', purpose: 'maskable any' })
    if (config?.icon192) icons.push({ src: config.icon192, sizes: '192x192', type: 'image/png', purpose: 'maskable any' })
    if (config?.icon384) icons.push({ src: config.icon384, sizes: '384x384', type: 'image/png', purpose: 'maskable any' })
    if (config?.icon512) icons.push({ src: config.icon512, sizes: '512x512', type: 'image/png', purpose: 'maskable any' })

    const screenshots = []
    if (config?.screenshot1) screenshots.push({ src: config.screenshot1, sizes: '1080x1920', type: 'image/png', form_factor: 'narrow' })
    if (config?.screenshot2) screenshots.push({ src: config.screenshot2, sizes: '1080x1920', type: 'image/png', form_factor: 'narrow' })
    if (config?.screenshot3) screenshots.push({ src: config.screenshot3, sizes: '1080x1920', type: 'image/png', form_factor: 'narrow' })

    const manifest: Record<string, unknown> = {
      name: config?.appName || 'UNICA - Clube de Benefícios',
      short_name: config?.shortName || 'UNICA',
      description: config?.description || 'Seu clube de benefícios e descontos exclusivos',
      start_url: config?.startUrl || '/',
      display: config?.display || 'standalone',
      background_color: config?.backgroundColor || '#ffffff',
      theme_color: config?.themeColor || '#000000',
      orientation: config?.orientation || 'portrait-primary',
      scope: config?.scope || '/',
      lang: 'pt-BR',
      categories: ['lifestyle', 'shopping', 'business'],
      icons: icons.length > 0 ? icons : [
        { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable any' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable any' }
      ],
      shortcuts: [
        {
          name: 'Ver Parceiros',
          short_name: 'Parceiros',
          url: '/app/parceiros'
        },
        {
          name: 'Minha Carteirinha',
          short_name: 'Carteirinha',
          url: '/app/carteirinha'
        }
      ]
    }

    if (screenshots.length > 0) {
      manifest.screenshots = screenshots
    }

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=0, must-revalidate'
      }
    })

  } catch (error) {
    console.error('Erro ao gerar manifest:', error)
    
    // Retornar manifest padrão em caso de erro
    return NextResponse.json({
      name: 'UNICA - Clube de Benefícios',
      short_name: 'UNICA',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#000000',
      icons: []
    }, {
      headers: {
        'Content-Type': 'application/manifest+json'
      }
    })
  }
}
