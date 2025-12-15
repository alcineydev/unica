import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let config = await prisma.pWAConfig.findFirst()

    if (!config) {
      // Criar configuração padrão
      config = await prisma.pWAConfig.create({
        data: {}
      })
    }

    return NextResponse.json({ config })

  } catch (error) {
    console.error('Erro ao buscar configurações PWA:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()

    let config = await prisma.pWAConfig.findFirst()

    if (config) {
      config = await prisma.pWAConfig.update({
        where: { id: config.id },
        data: {
          appName: body.appName,
          shortName: body.shortName,
          description: body.description,
          themeColor: body.themeColor,
          backgroundColor: body.backgroundColor,
          icon72: body.icon72 || null,
          icon96: body.icon96 || null,
          icon128: body.icon128 || null,
          icon144: body.icon144 || null,
          icon152: body.icon152 || null,
          icon192: body.icon192 || null,
          icon384: body.icon384 || null,
          icon512: body.icon512 || null,
          splashIphone5: body.splashIphone5 || null,
          splashIphone6: body.splashIphone6 || null,
          splashIphonePlus: body.splashIphonePlus || null,
          splashIphoneX: body.splashIphoneX || null,
          splashIphoneXr: body.splashIphoneXr || null,
          splashIphoneXsMax: body.splashIphoneXsMax || null,
          splashIpad: body.splashIpad || null,
          splashIpadPro: body.splashIpadPro || null,
          display: body.display,
          orientation: body.orientation,
          startUrl: body.startUrl,
          scope: body.scope,
          screenshot1: body.screenshot1 || null,
          screenshot2: body.screenshot2 || null,
          screenshot3: body.screenshot3 || null,
          isActive: body.isActive
        }
      })
    } else {
      config = await prisma.pWAConfig.create({
        data: body
      })
    }

    return NextResponse.json({ config })

  } catch (error) {
    console.error('Erro ao salvar configurações PWA:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
