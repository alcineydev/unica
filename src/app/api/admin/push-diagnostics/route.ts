import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { webpush, isWebPushConfigured } from '@/lib/web-push'

// Obter configuração VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@unicabeneficios.com.br'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin ou developer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !['ADMIN', 'DEVELOPER'].includes(user.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // 1. Verificar configuração VAPID
    const vapidConfig = {
      publicKeyConfigured: !!vapidPublicKey,
      privateKeyConfigured: !!vapidPrivateKey,
      subjectConfigured: !!vapidSubject,
      publicKeyPreview: vapidPublicKey ? `${vapidPublicKey.substring(0, 20)}...` : null,
      webPushConfigured: isWebPushConfigured(),
    }

    // 2. Buscar todas as subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 3. Estatísticas por role
    const statsByRole = subscriptions.reduce((acc, sub) => {
      const role = sub.user?.role || 'SEM_USER'
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 4. Subscriptions do usuário atual
    const mySubscriptions = subscriptions.filter(s => s.userId === session.user.id)

    // 5. Buscar nome do usuário (pode estar em Assinante, Parceiro, ou Admin)
    const getUserName = async (userId: string, role: string) => {
      try {
        if (role === 'ASSINANTE') {
          const assinante = await prisma.assinante.findUnique({
            where: { userId },
            select: { name: true }
          })
          return assinante?.name
        } else if (role === 'PARCEIRO') {
          const parceiro = await prisma.parceiro.findUnique({
            where: { userId },
            select: { tradeName: true, companyName: true }
          })
          return parceiro?.tradeName || parceiro?.companyName
        } else if (role === 'ADMIN' || role === 'DEVELOPER') {
          const admin = await prisma.admin.findUnique({
            where: { userId },
            select: { name: true }
          })
          return admin?.name
        }
      } catch {
        return null
      }
      return null
    }

    // 6. Formatar subscriptions para resposta
    const formattedSubscriptions = await Promise.all(subscriptions.map(async (sub) => {
      const userName = await getUserName(sub.userId, sub.user?.role || '')

      return {
        id: sub.id,
        visibleId: sub.id.substring(0, 8),
        endpoint: sub.endpoint.substring(0, 60) + '...',
        fullEndpoint: sub.endpoint,
        endpointProvider: sub.endpoint.includes('fcm.googleapis.com') ? 'FCM (Google)' :
                          sub.endpoint.includes('mozilla.com') ? 'Mozilla' :
                          sub.endpoint.includes('windows.com') ? 'Windows' :
                          sub.endpoint.includes('apple.com') ? 'Apple' : 'Outro',
        userId: sub.userId,
        userName: userName || 'N/A',
        userEmail: sub.user?.email || 'N/A',
        userRole: sub.user?.role || 'N/A',
        platform: sub.platform || 'N/A',
        userAgent: sub.userAgent || 'N/A',
        deviceInfo: sub.deviceInfo || 'N/A',
        isActive: sub.isActive,
        createdAt: sub.createdAt,
        isCurrentUser: sub.userId === session.user.id,
      }
    }))

    return NextResponse.json({
      success: true,
      currentUser: {
        id: session.user.id,
        name: user.email,
        email: user.email,
        role: user.role,
      },
      vapidConfig,
      statistics: {
        total: subscriptions.length,
        active: subscriptions.filter(s => s.isActive).length,
        inactive: subscriptions.filter(s => !s.isActive).length,
        byRole: statsByRole,
        mySubscriptions: mySubscriptions.length,
      },
      subscriptions: formattedSubscriptions,
    })

  } catch (error) {
    console.error('[PUSH-DIAGNOSTICS] Erro:', error)
    return NextResponse.json({
      error: 'Erro ao buscar diagnóstico',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// POST - Testar envio de push para uma subscription específica
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin ou developer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !['ADMIN', 'DEVELOPER'].includes(user.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { subscriptionId, testType } = body

    // Verificar VAPID
    if (!isWebPushConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'VAPID keys não configuradas',
        details: {
          publicKey: !!vapidPublicKey,
          privateKey: !!vapidPrivateKey,
        }
      }, { status: 500 })
    }

    let targetSubscriptions: Array<{
      id: string
      endpoint: string
      p256dh: string
      auth: string
    }> = []

    if (testType === 'self') {
      // Testar apenas minhas subscriptions
      targetSubscriptions = await prisma.pushSubscription.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { id: true, endpoint: true, p256dh: true, auth: true }
      })
    } else if (testType === 'specific' && subscriptionId) {
      // Testar subscription específica
      const sub = await prisma.pushSubscription.findUnique({
        where: { id: subscriptionId },
        select: { id: true, endpoint: true, p256dh: true, auth: true }
      })
      if (sub) targetSubscriptions = [sub]
    } else if (testType === 'all-admins') {
      // Testar todas as subscriptions de admins
      targetSubscriptions = await prisma.pushSubscription.findMany({
        where: {
          isActive: true,
          user: {
            role: { in: ['ADMIN', 'DEVELOPER'] }
          }
        },
        select: { id: true, endpoint: true, p256dh: true, auth: true }
      })
    }

    if (targetSubscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma subscription encontrada para teste',
        testType,
        subscriptionId,
      }, { status: 404 })
    }

    const results: Array<{
      subscriptionId: string
      status: 'SUCCESS' | 'FAILED' | 'EXPIRED_AND_DELETED'
      statusCode?: number
      message?: string
      headers?: Record<string, string>
      body?: string
    }> = []

    for (const sub of targetSubscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        }
      }

      const payload = JSON.stringify({
        title: '🧪 Teste UNICA',
        body: `Push funcionando! Enviado às ${new Date().toLocaleTimeString('pt-BR')}`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: {
          type: 'TEST',
          url: '/admin',
          timestamp: Date.now(),
        }
      })

      try {
        const response = await webpush.sendNotification(pushSubscription, payload)
        results.push({
          subscriptionId: sub.id.substring(0, 8),
          status: 'SUCCESS',
          statusCode: response.statusCode,
        })
      } catch (error: unknown) {
        const err = error as { statusCode?: number; message?: string; body?: string }
        console.error(`[PUSH-TEST] Erro ao enviar para ${sub.id}:`, err)

        // Se subscription expirou, remover do banco
        if (err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } })
          results.push({
            subscriptionId: sub.id.substring(0, 8),
            status: 'EXPIRED_AND_DELETED',
            statusCode: 410,
            message: 'Subscription expirada e removida do banco',
          })
        } else {
          results.push({
            subscriptionId: sub.id.substring(0, 8),
            status: 'FAILED',
            statusCode: err.statusCode,
            message: err.message,
            body: err.body,
          })
        }
      }
    }

    const successCount = results.filter(r => r.status === 'SUCCESS').length
    const failedCount = results.filter(r => r.status === 'FAILED').length
    const expiredCount = results.filter(r => r.status === 'EXPIRED_AND_DELETED').length

    return NextResponse.json({
      success: successCount > 0,
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount,
        expired: expiredCount,
      },
      results,
    })

  } catch (error) {
    console.error('[PUSH-TEST] Erro geral:', error)
    return NextResponse.json({
      error: 'Erro ao testar push',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// DELETE - Remover subscription específica
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin ou developer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !['ADMIN', 'DEVELOPER'].includes(user.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('id')

    if (!subscriptionId) {
      return NextResponse.json({ error: 'ID da subscription não fornecido' }, { status: 400 })
    }

    await prisma.pushSubscription.delete({
      where: { id: subscriptionId }
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription removida com sucesso'
    })

  } catch (error) {
    console.error('[PUSH-DELETE] Erro:', error)
    return NextResponse.json({
      error: 'Erro ao remover subscription',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
