import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Listar avaliações do parceiro
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id }
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const filtro = searchParams.get('filtro') || 'todas'
    const ordenar = searchParams.get('ordenar') || 'recente'

    // Construir filtro
    const where: any = { parceiroId: parceiro.id }

    if (filtro === 'publicadas') {
      where.publicada = true
    } else if (filtro === 'nao-publicadas') {
      where.publicada = false
    }

    // Construir ordenação
    let orderBy: any = { createdAt: 'desc' }

    if (ordenar === 'antiga') {
      orderBy = { createdAt: 'asc' }
    } else if (ordenar === 'maior') {
      orderBy = { nota: 'desc' }
    } else if (ordenar === 'menor') {
      orderBy = { nota: 'asc' }
    }

    const avaliacoes = await prisma.avaliacao.findMany({
      where,
      orderBy,
      include: {
        assinante: {
          include: {
            user: true
          }
        }
      }
    })

    // Calcular estatísticas
    const todasAvaliacoes = await prisma.avaliacao.findMany({
      where: { parceiroId: parceiro.id }
    })

    const totalAvaliacoes = todasAvaliacoes.length
    const mediaNotas = totalAvaliacoes > 0
      ? todasAvaliacoes.reduce((sum, a) => sum + a.nota, 0) / totalAvaliacoes
      : 0
    const totalPublicadas = todasAvaliacoes.filter(a => a.publicada).length

    // Distribuição de notas
    const distribuicao = {
      5: todasAvaliacoes.filter(a => a.nota === 5).length,
      4: todasAvaliacoes.filter(a => a.nota === 4).length,
      3: todasAvaliacoes.filter(a => a.nota === 3).length,
      2: todasAvaliacoes.filter(a => a.nota === 2).length,
      1: todasAvaliacoes.filter(a => a.nota === 1).length,
    }

    return NextResponse.json({
      avaliacoes: avaliacoes.map(a => ({
        id: a.id,
        nota: a.nota,
        comentario: a.comentario,
        resposta: a.resposta,
        respondidoEm: a.respondidoEm?.toISOString() || null,
        publicada: a.publicada,
        createdAt: a.createdAt.toISOString(),
        assinante: {
          id: a.assinante.id,
          nome: a.assinante.name || a.assinante.user?.email?.split('@')[0] || 'Cliente',
          avatar: (a.assinante.user as any)?.avatar || null
        }
      })),
      estatisticas: {
        total: totalAvaliacoes,
        media: Math.round(mediaNotas * 10) / 10,
        publicadas: totalPublicadas,
        distribuicao
      }
    })

  } catch (error) {
    console.error('[PARCEIRO AVALIACOES GET] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar avaliações' }, { status: 500 })
  }
}
