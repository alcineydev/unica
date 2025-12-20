import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST() {
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
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
    }

    // Marcar todas como lidas
    await prisma.assinanteNotificacao.updateMany({
      where: {
        assinanteId: assinante.id,
        lida: false
      },
      data: { lida: true }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[NOTIFICATIONS READ-ALL] Erro:', error)
    return NextResponse.json({ error: 'Erro ao marcar notificações' }, { status: 500 })
  }
}
