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

    // Buscar parceiro
    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id }
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Marcar todas as notificações como lidas
    await prisma.parceiroNotificacao.updateMany({
      where: { parceiroId: parceiro.id, lida: false },
      data: { lida: true }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[PARCEIRO NOTIFICACOES] Erro:', error)
    return NextResponse.json({ error: 'Erro ao marcar notificações' }, { status: 500 })
  }
}
