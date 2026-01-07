import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

// GET - Buscar configs do developer
export async function GET() {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const configs = await prisma.config.findMany({
      where: {
        key: {
          in: ['evolution_api_url', 'evolution_api_key']
        }
      }
    })

    return NextResponse.json(configs)
  } catch (error) {
    console.error('Erro ao buscar configs:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar configs
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    
    const updates = Object.entries(body).map(([key, value]) => 
      prisma.config.upsert({
        where: { key },
        update: { value: value as string },
        create: { 
          key, 
          value: value as string, 
          description: `Config: ${key}`,
          category: 'INTEGRATION',
        }
      })
    )
    
    await Promise.all(updates)

    // Registrar log
    await logger.configUpdated(session.user.id!, Object.keys(body).join(', '))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar configs:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

