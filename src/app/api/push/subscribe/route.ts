import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getVapidPublicKey } from '@/lib/web-push'

// GET - Retorna a VAPID public key para o cliente
export async function GET() {
  const publicKey = getVapidPublicKey()

  if (!publicKey) {
    return NextResponse.json(
      { error: 'Push não configurado' },
      { status: 500 }
    )
  }

  return NextResponse.json({ publicKey })
}

export async function POST(request: NextRequest) {
  console.log('[PUSH SUBSCRIBE] Recebendo requisição...')

  try {
    const session = await auth()
    console.log('[PUSH SUBSCRIBE] Sessão:', session?.user?.id ? 'autenticado' : 'NÃO AUTENTICADO')

    if (!session?.user?.id) {
      console.log('[PUSH SUBSCRIBE] Rejeitado: não autorizado')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint, keys, deviceInfo } = body

    console.log('[PUSH SUBSCRIBE] Dados recebidos:', {
      endpoint: endpoint?.substring(0, 50) + '...',
      hasP256dh: !!keys?.p256dh,
      hasAuth: !!keys?.auth,
      deviceInfo: deviceInfo?.substring(0, 30)
    })

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      console.log('[PUSH SUBSCRIBE] Rejeitado: dados inválidos')
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Verificar se já existe
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint }
    })

    console.log('[PUSH SUBSCRIBE] Subscription existente:', !!existing)

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
      console.log('[PUSH SUBSCRIBE] Subscription atualizada')
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
      console.log('[PUSH SUBSCRIBE] Nova subscription criada')
    }

    console.log('[PUSH SUBSCRIBE] Sucesso!')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[PUSH SUBSCRIBE] Erro:', error)
    return NextResponse.json({ error: 'Erro ao salvar subscription' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  console.log('[PUSH UNSUBSCRIBE] Recebendo requisição...')

  try {
    const session = await auth()

    if (!session?.user?.id) {
      console.log('[PUSH UNSUBSCRIBE] Rejeitado: não autorizado')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint obrigatório' }, { status: 400 })
    }

    console.log('[PUSH UNSUBSCRIBE] Removendo:', endpoint.substring(0, 50) + '...')

    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: session.user.id
      }
    })

    console.log('[PUSH UNSUBSCRIBE] Sucesso!')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[PUSH UNSUBSCRIBE] Erro:', error)
    return NextResponse.json({ error: 'Erro ao remover subscription' }, { status: 500 })
  }
}
