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

    // Busca o assinante
    const assinante = await prisma.assinante.findUnique({
      where: { userId: session.user.id },
      include: {
        plan: {
          include: {
            planBenefits: true,
          },
        },
        city: true,
      },
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
        city: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
    })

    return NextResponse.json({
      data: {
        assinante: {
          name: assinante.name,
          points: Number(assinante.points),
          cashback: Number(assinante.cashback),
          plan: {
            name: assinante.plan.name,
          },
        },
        parceiros,
        totalBeneficios: assinante.plan.planBenefits.length,
      },
    })
  } catch (error) {
    console.error('Erro ao carregar home:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

