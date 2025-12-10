import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ASSINANTE') {
      return NextResponse.json(
        { error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    // Busca o assinante para pegar a cidade
    const assinante = await prisma.assinante.findUnique({
      where: { userId: session.user.id },
    })

    if (!assinante) {
      return NextResponse.json(
        { error: 'Assinante nao encontrado' },
        { status: 404 }
      )
    }

    // Busca parceiros da mesma cidade
    const parceiros = await prisma.parceiro.findMany({
      where: {
        cityId: assinante.cityId,
        isActive: true,
        user: {
          isActive: true,
        },
      },
      select: {
        id: true,
        companyName: true,
        tradeName: true,
        category: true,
        description: true,
        contact: true,
        city: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { category: 'asc' },
        { companyName: 'asc' },
      ],
    })

    // Incrementa pageViews de cada parceiro visualizado
    // Em producao, fazer isso de forma mais eficiente
    for (const p of parceiros) {
      await prisma.parceiro.update({
        where: { id: p.id },
        data: {
          metrics: {
            ...(await prisma.parceiro.findUnique({ where: { id: p.id } }))?.metrics as object,
            pageViews: ((await prisma.parceiro.findUnique({ where: { id: p.id } }))?.metrics as { pageViews?: number })?.pageViews || 0 + 1,
          },
        },
      }).catch(() => {}) // Ignora erros de metricas
    }

    return NextResponse.json({
      data: parceiros.map(p => ({
        ...p,
        contact: p.contact as { whatsapp: string; phone: string },
      })),
    })
  } catch (error) {
    console.error('Erro ao carregar parceiros:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

