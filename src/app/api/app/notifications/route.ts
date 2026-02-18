import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10') || 10, 1), 100)

    // Buscar notificações diretamente via relação
    const notificacoes = await prisma.assinanteNotificacao.findMany({
      where: {
        assinante: { userId: session.user.id! }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({
      notifications: notificacoes.map(n => ({
        id: n.id,
        title: n.titulo,
        message: n.mensagem,
        type: n.tipo,
        read: n.lida,
        data: n.dados ? JSON.stringify(n.dados) : null,
        createdAt: n.createdAt.toISOString()
      }))
    })

  } catch (error) {
    console.error('[APP NOTIFICATIONS] Erro:', error)
    return NextResponse.json({ notifications: [] })
  }
}
