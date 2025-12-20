import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json()
    const { lida } = body

    // Atualizar notificação (apenas se pertencer ao parceiro)
    await prisma.parceiroNotificacao.updateMany({
      where: {
        id: params.id,
        parceiroId: parceiro.id
      },
      data: { lida }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[PARCEIRO NOTIFICACOES] Erro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar notificação' }, { status: 500 })
  }
}
