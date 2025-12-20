import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ count: 0 })
    }

    // Buscar assinante
    const assinante = await prisma.assinante.findFirst({
      where: { userId: session.user.id }
    })

    if (!assinante) {
      return NextResponse.json({ count: 0 })
    }

    // Contar notificações não lidas
    const count = await prisma.assinanteNotificacao.count({
      where: {
        assinanteId: assinante.id,
        lida: false
      }
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('[NOTIFICATIONS COUNT] Erro:', error)
    return NextResponse.json({ count: 0 })
  }
}
