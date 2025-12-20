import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar assinante
    const assinante = await prisma.assinante.findFirst({
      where: { userId: session.user.id }
    })

    if (!assinante) {
      return NextResponse.json({ notifications: [] })
    }

    // Buscar notificações
    const notificacoes = await prisma.assinanteNotificacao.findMany({
      where: { assinanteId: assinante.id },
      orderBy: { createdAt: 'desc' },
      take: 50
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
