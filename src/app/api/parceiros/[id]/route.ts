import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const parceiro = await prisma.parceiro.findUnique({
      where: { id },
      include: {
        city: true,
        avaliacoes: {
          where: { publicada: true },
          select: { nota: true }
        }
      }
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Calcular média de avaliações
    const mediaAvaliacoes = parceiro.avaliacoes.length > 0
      ? parceiro.avaliacoes.reduce((sum, a) => sum + a.nota, 0) / parceiro.avaliacoes.length
      : 0

    const contact = parceiro.contact as any

    return NextResponse.json({
      parceiro: {
        id: parceiro.id,
        tradeName: parceiro.tradeName,
        companyName: parceiro.companyName,
        logo: parceiro.logo,
        banner: parceiro.banner,
        description: parceiro.description,
        category: parceiro.category,
        phone: contact?.phone,
        whatsapp: contact?.whatsapp,
        address: parceiro.address,
        cidade: parceiro.city?.name,
        estado: parceiro.city?.state,
        mediaAvaliacoes: Math.round(mediaAvaliacoes * 10) / 10,
        totalAvaliacoes: parceiro.avaliacoes.length
      }
    })

  } catch (error) {
    console.error('[PARCEIRO GET] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar parceiro' }, { status: 500 })
  }
}
