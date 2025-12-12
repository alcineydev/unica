import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

// GET - Listar todos os planos ativos (público)
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      include: {
        planBenefits: {
          include: {
            benefit: {
              select: {
                id: true,
                name: true,
                type: true,
                value: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ data: plans })
  } catch (error) {
    console.error('Erro ao listar planos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

