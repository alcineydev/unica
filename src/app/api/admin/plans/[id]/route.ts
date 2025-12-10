import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { updatePlanSchema } from '@/lib/validations/plan'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Buscar plano por ID
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        planBenefits: {
          include: {
            benefit: true,
          },
        },
        _count: {
          select: {
            assinantes: true,
          },
        },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: plan })
  } catch (error) {
    console.error('Erro ao buscar plano:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar plano
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const validationResult = updatePlanSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Verifica se o plano existe
    const existingPlan = await prisma.plan.findUnique({
      where: { id },
    })

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    const { benefitIds, ...rest } = validationResult.data

    // Se está atualizando benefícios
    if (benefitIds) {
      // Verifica se os benefícios existem
      const benefits = await prisma.benefit.findMany({
        where: { id: { in: benefitIds } },
      })

      if (benefits.length !== benefitIds.length) {
        return NextResponse.json(
          { error: 'Um ou mais benefícios selecionados não existem' },
          { status: 400 }
        )
      }

      // Remove associações antigas e cria novas
      await prisma.$transaction([
        prisma.planBenefit.deleteMany({
          where: { planId: id },
        }),
        prisma.planBenefit.createMany({
          data: benefitIds.map((benefitId) => ({
            planId: id,
            benefitId,
          })),
        }),
      ])
    }

    // Atualiza o plano
    const plan = await prisma.plan.update({
      where: { id },
      data: rest,
      include: {
        planBenefits: {
          include: {
            benefit: true,
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Plano atualizado com sucesso', data: plan }
    )
  } catch (error) {
    console.error('Erro ao atualizar plano:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir plano
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verifica se o plano existe
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assinantes: true,
          },
        },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Não permite excluir plano com assinantes
    if (plan._count.assinantes > 0) {
      return NextResponse.json(
        { 
          error: 'Não é possível excluir este plano pois existem assinantes vinculados. Desative o plano ao invés de excluir.' 
        },
        { status: 400 }
      )
    }

    // Remove associações e o plano
    await prisma.$transaction([
      prisma.planBenefit.deleteMany({
        where: { planId: id },
      }),
      prisma.plan.delete({
        where: { id },
      }),
    ])

    return NextResponse.json(
      { message: 'Plano excluído com sucesso' }
    )
  } catch (error) {
    console.error('Erro ao excluir plano:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

