import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Listar todas as configurações
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where = category ? { category } : {}

    const configs = await prisma.systemConfig.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    })

    // Agrupar por categoria
    const grouped = configs.reduce((acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = []
      }
      acc[config.category].push(config)
      return acc
    }, {} as Record<string, typeof configs>)

    return NextResponse.json({ configs, grouped })
  } catch (error: any) {
    console.error('[Config GET] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
  }
}

// PUT - Atualizar configuração única
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json({ error: 'Chave obrigatória' }, { status: 400 })
    }

    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: {
        value,
        updatedAt: new Date()
      },
      create: {
        key,
        value,
        type: 'text',
        category: 'general'
      }
    })

    return NextResponse.json(config)
  } catch (error: any) {
    console.error('[Config PUT] Erro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar configuração' }, { status: 500 })
  }
}

// POST - Atualizar múltiplas configurações de uma vez
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { configs } = body // Array de { key, value }

    if (!configs || !Array.isArray(configs)) {
      return NextResponse.json({ error: 'Configurações inválidas' }, { status: 400 })
    }

    // Atualizar cada configuração
    const results = await Promise.all(
      configs.map(({ key, value }: { key: string; value: string }) =>
        prisma.systemConfig.upsert({
          where: { key },
          update: { value, updatedAt: new Date() },
          create: { key, value, type: 'text', category: 'general' }
        })
      )
    )

    return NextResponse.json({ updated: results.length, configs: results })
  } catch (error: any) {
    console.error('[Config POST] Erro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 })
  }
}
