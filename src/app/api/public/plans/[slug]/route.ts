import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET - Buscar plano por slug (público)
export async function GET(request: Request, { params }: RouteParams) {
  console.log('=== API /api/public/plans/[slug] ===')
  
  try {
    const { slug } = await params
    console.log('Buscando plano com slug:', slug)

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug não fornecido' },
        { status: 400 }
      )
    }

    console.log('Executando query...')
    const plan = await prisma.plan.findFirst({
      where: {
        slug,
        isActive: true,
      },
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

    console.log('Plano encontrado:', plan ? plan.name : 'Não encontrado')

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error('=== ERRO ao buscar plano ===')
    console.error('Erro:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

