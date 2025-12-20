import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Listar avaliações do assinante
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const assinante = await prisma.assinante.findFirst({
      where: { userId: session.user.id }
    })

    if (!assinante) {
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
    }

    const avaliacoes = await prisma.avaliacao.findMany({
      where: { assinanteId: assinante.id },
      include: {
        parceiro: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      avaliacoes: avaliacoes.map(a => ({
        id: a.id,
        nota: a.nota,
        comentario: a.comentario,
        createdAt: a.createdAt.toISOString(),
        parceiro: {
          id: a.parceiro.id,
          nome: a.parceiro.tradeName || a.parceiro.companyName,
          logo: a.parceiro.logo
        }
      }))
    })

  } catch (error) {
    console.error('[APP AVALIACOES GET] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar avaliações' }, { status: 500 })
  }
}

// POST - Criar avaliação
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { parceiroId, nota, comentario } = body

    if (!parceiroId || !nota) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    if (nota < 1 || nota > 5) {
      return NextResponse.json({ error: 'Nota deve ser entre 1 e 5' }, { status: 400 })
    }

    const assinante = await prisma.assinante.findFirst({
      where: { userId: session.user.id }
    })

    if (!assinante) {
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
    }

    // Verificar se parceiro existe
    const parceiro = await prisma.parceiro.findUnique({
      where: { id: parceiroId }
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Criar avaliação
    const avaliacao = await prisma.avaliacao.create({
      data: {
        assinanteId: assinante.id,
        parceiroId,
        nota,
        comentario: comentario || null,
        publicada: false
      }
    })

    // Dar pontos de bonificação ao assinante (1 ponto por avaliar)
    await prisma.assinante.update({
      where: { id: assinante.id },
      data: {
        points: { increment: 1 }
      }
    })

    // Criar notificação para o parceiro
    try {
      const msgComentario = comentario ? `: "${comentario.substring(0, 50)}..."` : ''
      await prisma.parceiroNotificacao.create({
        data: {
          parceiroId,
          tipo: 'avaliacao',
          titulo: 'Nova avaliação recebida',
          mensagem: `${assinante.name} avaliou sua empresa com ${nota} estrela${nota > 1 ? 's' : ''}${msgComentario}`,
          lida: false
        }
      })
    } catch (e) {
      console.log('Erro ao criar notificação:', e)
    }

    return NextResponse.json({
      success: true,
      message: 'Avaliação enviada com sucesso! +1 ponto',
      avaliacao: {
        id: avaliacao.id,
        nota: avaliacao.nota
      }
    })

  } catch (error) {
    console.error('[APP AVALIACOES POST] Erro:', error)
    return NextResponse.json({ error: 'Erro ao enviar avaliação' }, { status: 500 })
  }
}
