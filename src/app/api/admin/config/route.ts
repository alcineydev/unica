import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session || !['DEVELOPER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const configRecord = await prisma.config.findFirst({
      where: { key: 'global' }
    })

    // Deserializar o JSON string para objeto
    let configValue = null
    if (configRecord?.value) {
      try {
        configValue = JSON.parse(configRecord.value)
      } catch {
        // Se não for JSON válido, retornar como está
        configValue = configRecord.value
      }
    }

    return NextResponse.json({ config: configValue })

  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !['DEVELOPER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Serializar o objeto para JSON string
    const valueString = JSON.stringify(body)

    const existing = await prisma.config.findFirst({
      where: { key: 'global' }
    })

    if (existing) {
      await prisma.config.update({
        where: { id: existing.id },
        data: { value: valueString }
      })
    } else {
      await prisma.config.create({
        data: {
          key: 'global',
          value: valueString,
          description: 'Configurações globais do sistema',
          category: 'SYSTEM'
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
