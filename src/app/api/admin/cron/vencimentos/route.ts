import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { processExpirationNotifications } from '@/lib/notifications-multicanal'

// GET - Executar cron manualmente (para testes) ou via Vercel Cron
export async function GET(request: NextRequest) {
  try {
    // Verificar se é chamada do Vercel Cron ou admin autenticado
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Se tem CRON_SECRET configurado, verificar
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      // Chamada válida do Vercel Cron
      console.log('[CRON-VENCIMENTOS] Executando via Vercel Cron')
    } else {
      // Se não é cron, verificar se é admin
      const session = await auth()
      if (!session?.user || !['DEVELOPER', 'ADMIN'].includes(session.user.role as string)) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
      }
      console.log('[CRON-VENCIMENTOS] Executando manualmente por:', session.user.email)
    }

    console.log('[CRON-VENCIMENTOS] Iniciando execução...')

    const result = await processExpirationNotifications({
      channels: ['email', 'whatsapp', 'push'],
      daysBeforeExpiration: [7, 3, 1, 0]
    })

    console.log('[CRON-VENCIMENTOS] Finalizado:', result.processed, 'processados')

    return NextResponse.json({
      success: true,
      ...result,
      executedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('[CRON-VENCIMENTOS] Erro:', error)
    return NextResponse.json({
      error: 'Erro ao executar cron',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// POST - Executar cron com configuração customizada
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !['DEVELOPER', 'ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { channels, daysBeforeExpiration } = body

    console.log('[CRON-VENCIMENTOS] Executando com config customizada:', { channels, daysBeforeExpiration })

    const result = await processExpirationNotifications({
      channels: channels || ['email', 'whatsapp', 'push'],
      daysBeforeExpiration: daysBeforeExpiration || [7, 3, 1, 0]
    })

    return NextResponse.json({
      success: true,
      ...result,
      executedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('[CRON-VENCIMENTOS] Erro:', error)
    return NextResponse.json({
      error: 'Erro ao executar cron',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
