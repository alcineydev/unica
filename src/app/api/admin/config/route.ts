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

    return NextResponse.json({ config: configRecord?.value || null })

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

    const existing = await prisma.config.findFirst({
      where: { key: 'global' }
    })

    if (existing) {
      await prisma.config.update({
        where: { id: existing.id },
        data: { value: body }
      })
    } else {
      await prisma.config.create({
        data: {
          key: 'global',
          value: body
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

