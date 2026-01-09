import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE() {
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

    const count = await prisma.pushSubscription.count()

    if (count > 0) {
      await prisma.pushSubscription.deleteMany({})
      console.log(`[PUSH-CLEAR] ${count} subscriptions removidas por ${user.email}`)
    }

    return NextResponse.json({
      success: true,
      deleted: count,
      message: `${count} subscription(s) removida(s)`
    })

  } catch (error) {
    console.error('[PUSH-CLEAR] Erro:', error)
    return NextResponse.json({
      error: 'Erro ao limpar subscriptions',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
