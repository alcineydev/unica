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

    // Buscar parceiro
    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id }
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Buscar notificações do parceiro
    const notificacoes = await prisma.parceiroNotificacao.findMany({
      where: { parceiroId: parceiro.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({
      notificacoes: notificacoes.map(n => ({
        id: n.id,
        tipo: n.tipo,
        titulo: n.titulo,
        mensagem: n.mensagem,
        lida: n.lida,
        createdAt: n.createdAt.toISOString()
      }))
    })

  } catch (error) {
    console.error('[PARCEIRO NOTIFICACOES] Erro:', error)

    // Se a tabela não existir, retornar array vazio
    if ((error as any)?.code === 'P2021') {
      return NextResponse.json({ notificacoes: [] })
    }

    return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 })
  }
}
