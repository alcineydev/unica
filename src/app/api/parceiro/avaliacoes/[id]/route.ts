import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PATCH - Atualizar avaliação (publicar/despublicar)
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
    const { publicada } = body

    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id }
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Verificar se a avaliação pertence ao parceiro
    const avaliacao = await prisma.avaliacao.findFirst({
      where: {
        id,
        parceiroId: parceiro.id
      }
    })

    if (!avaliacao) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
    }

    // Atualizar
    const updated = await prisma.avaliacao.update({
      where: { id },
      data: { publicada }
    })

    return NextResponse.json({
      success: true,
      avaliacao: updated
    })

  } catch (error) {
    console.error('[AVALIACAO PATCH] Erro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar avaliação' }, { status: 500 })
  }
}
