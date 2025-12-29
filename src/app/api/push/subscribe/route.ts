import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

// Fallback hardcoded
const FALLBACK_PUBLIC_KEY = 'BDgxbvXNieDaGmEvQxgwa1GQSt_4Fq-NjC2VwHmXp0dIXVLwKXNOEzg6GH1kEX6bAt9DGSBh_HCS1ebaIUsRQYM'

// GET - Retorna a VAPID public key para o cliente
export async function GET() {
  const envKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const publicKey = envKey || FALLBACK_PUBLIC_KEY
  const source = envKey ? 'env' : 'fallback'

  logger.debug('[API Push] GET - source:', source, 'key preview:', publicKey?.substring(0, 20))

  return NextResponse.json({
    publicKey,
    source,
    configured: true
  })
}

export async function POST(request: NextRequest) {
  logger.debug('[PUSH SUBSCRIBE] Recebendo requisição...')

  try {
    const session = await auth()
    logger.debug('[PUSH SUBSCRIBE] Sessão:', session?.user?.id ? 'autenticado' : 'NÃO AUTENTICADO')

    if (!session?.user?.id) {
      logger.debug('[PUSH SUBSCRIBE] Rejeitado: não autorizado')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint, keys, deviceInfo, userAgent, platform } = body

    logger.debug('[PUSH SUBSCRIBE] Dados recebidos:', {
      endpoint: endpoint?.substring(0, 50) + '...',
      hasP256dh: !!keys?.p256dh,
      hasAuth: !!keys?.auth,
      deviceInfo: deviceInfo?.substring(0, 30),
      userAgent: userAgent?.substring(0, 30),
      platform
    })

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      logger.debug('[PUSH SUBSCRIBE] Rejeitado: dados inválidos')
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Verificar se já existe
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint }
    })

    logger.debug('[PUSH SUBSCRIBE] Subscription existente:', !!existing)

    if (existing) {
      // Atualizar se já existe
      await prisma.pushSubscription.update({
        where: { endpoint },
        data: {
          userId: session.user.id,
          p256dh: keys.p256dh,
          auth: keys.auth,
          deviceInfo: deviceInfo || null,
          userAgent: userAgent || null,
          platform: platform || null,
          isActive: true
        }
      })
      logger.debug('[PUSH SUBSCRIBE] Subscription atualizada')
    } else {
      // Criar novo
      await prisma.pushSubscription.create({
        data: {
          userId: session.user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          deviceInfo: deviceInfo || null,
          userAgent: userAgent || null,
          platform: platform || null,
          isActive: true
        }
      })
      logger.debug('[PUSH SUBSCRIBE] Nova subscription criada')
    }

    logger.debug('[PUSH SUBSCRIBE] Sucesso!')
    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    const err = error as Error & { code?: string; meta?: unknown }
    console.error('[PUSH SUBSCRIBE] Erro detalhado:', {
      message: err.message,
      name: err.name,
      code: err.code,
      meta: err.meta,
      stack: err.stack
    })

    // Verificar se é erro de tabela não existente
    if (err.code === 'P2021' || err.message?.includes('does not exist')) {
      return NextResponse.json({
        error: 'Tabela push_subscriptions não existe. Execute as migrations do Prisma.',
        code: 'TABLE_NOT_FOUND'
      }, { status: 500 })
    }

    // Erro de constraint única (endpoint já existe para outro usuário)
    if (err.code === 'P2002') {
      return NextResponse.json({
        error: 'Este dispositivo já está registrado',
        code: 'DUPLICATE_ENDPOINT'
      }, { status: 409 })
    }

    return NextResponse.json({
      error: 'Erro ao salvar subscription',
      details: err.message
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  logger.debug('[PUSH UNSUBSCRIBE] Recebendo requisição...')

  try {
    const session = await auth()

    if (!session?.user?.id) {
      logger.debug('[PUSH UNSUBSCRIBE] Rejeitado: não autorizado')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint obrigatório' }, { status: 400 })
    }

    logger.debug('[PUSH UNSUBSCRIBE] Removendo:', endpoint.substring(0, 50) + '...')

    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: session.user.id
      }
    })

    logger.debug('[PUSH UNSUBSCRIBE] Sucesso!')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[PUSH UNSUBSCRIBE] Erro:', error)
    return NextResponse.json({ error: 'Erro ao remover subscription' }, { status: 500 })
  }
}
