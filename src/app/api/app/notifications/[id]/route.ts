import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Buscar assinante
    const assinante = await prisma.assinante.findFirst({
      where: { userId: session.user.id }
    })

    if (!assinante) {
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
    }

    // Atualizar notificação (apenas se pertencer ao assinante)
    await prisma.assinanteNotificacao.updateMany({
      where: {
        id,
        assinanteId: assinante.id
      },
      data: { lida: body.read ?? true }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[NOTIFICATION PATCH] Erro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar notificação' }, { status: 500 })
  }
}
