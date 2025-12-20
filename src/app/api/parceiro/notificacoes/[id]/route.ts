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
        id,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Buscar parceiro
    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id }
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Deletar notificação (apenas se pertencer ao parceiro)
    await prisma.parceiroNotificacao.deleteMany({
      where: {
        id,
        parceiroId: parceiro.id
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[PARCEIRO NOTIFICACOES] Erro:', error)
    return NextResponse.json({ error: 'Erro ao deletar notificação' }, { status: 500 })
  }
}
