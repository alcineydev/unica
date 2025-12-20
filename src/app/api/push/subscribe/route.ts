import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint, keys, deviceInfo } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Verificar se já existe
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint }
    })

    if (existing) {
      // Atualizar se já existe
      await prisma.pushSubscription.update({
        where: { endpoint },
        data: {
          userId: session.user.id,
          p256dh: keys.p256dh,
          auth: keys.auth,
          deviceInfo: deviceInfo || null
        }
      })
    } else {
      // Criar novo
      await prisma.pushSubscription.create({
        data: {
          userId: session.user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          deviceInfo: deviceInfo || null
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[PUSH SUBSCRIBE] Erro:', error)
    return NextResponse.json({ error: 'Erro ao salvar subscription' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint obrigatório' }, { status: 400 })
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: session.user.id
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[PUSH UNSUBSCRIBE] Erro:', error)
    return NextResponse.json({ error: 'Erro ao remover subscription' }, { status: 500 })
  }
}
