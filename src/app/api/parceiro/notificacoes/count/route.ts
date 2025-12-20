import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PARCEIRO') {
      return NextResponse.json({ count: 0 })
    }

    // Buscar parceiro
    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id }
    })

    if (!parceiro) {
      return NextResponse.json({ count: 0 })
    }

    // Contar notificações não lidas
    const count = await prisma.parceiroNotificacao.count({
      where: {
        parceiroId: parceiro.id,
        lida: false
      }
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('[PARCEIRO NOTIFICATIONS COUNT] Erro:', error)
    return NextResponse.json({ count: 0 })
  }
}
