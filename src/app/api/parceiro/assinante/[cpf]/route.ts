import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ cpf: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'PARCEIRO') {
      return NextResponse.json(
        { error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    const { cpf } = await params

    // Valida CPF
    if (!cpf || cpf.length !== 11) {
      return NextResponse.json(
        { error: 'CPF invalido' },
        { status: 400 }
      )
    }

    // Busca o assinante
    const assinante = await prisma.assinante.findUnique({
      where: { cpf },
      include: {
        plan: {
          include: {
            planBenefits: {
              include: {
                benefit: true,
              },
            },
          },
        },
      },
    })

    if (!assinante) {
      return NextResponse.json(
        { error: 'Assinante nao encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: {
        id: assinante.id,
        name: assinante.name,
        cpf: assinante.cpf,
        points: Number(assinante.points),
        cashback: Number(assinante.cashback),
        subscriptionStatus: assinante.subscriptionStatus,
        plan: {
          id: assinante.plan.id,
          name: assinante.plan.name,
          planBenefits: assinante.plan.planBenefits.map(pb => ({
            benefit: {
              id: pb.benefit.id,
              name: pb.benefit.name,
              type: pb.benefit.type,
              value: pb.benefit.value,
            },
          })),
        },
      },
    })
  } catch (error) {
    console.error('Erro ao buscar assinante:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

