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

    const assinante = await prisma.assinante.findFirst({
      where: { userId: session.user.id },
      include: {
        user: true,
        plan: true
      }
    })

    if (!assinante) {
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      assinante: {
        id: assinante.id,
        nome: assinante.name,
        email: assinante.user.email,
        avatar: assinante.user.avatar,
        pontos: assinante.points || 0,
        cashback: assinante.cashback ? parseFloat(assinante.cashback.toString()) : 0,
        plano: assinante.plan?.name || 'Básico',
        status: assinante.subscriptionStatus
      }
    })

  } catch (error) {
    console.error('[ME GET] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}
