import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { updateSubscriberSchema } from '@/lib/validations/subscriber'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Buscar assinante por ID
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

    const subscriber = await prisma.assinante.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
        city: true,
        plan: {
          include: {
            planBenefits: {
              include: {
                benefit: true,
              },
            },
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    })

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Assinante não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: subscriber })
  } catch (error) {
    console.error('Erro ao buscar assinante:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar assinante
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

    const validationResult = updateSubscriberSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Verifica se o assinante existe
    const existingSubscriber = await prisma.assinante.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!existingSubscriber) {
      return NextResponse.json(
        { error: 'Assinante não encontrado' },
        { status: 404 }
      )
    }

    const { subscriptionStatus, cityId, planId, ...rest } = validationResult.data

    // Prepara os dados de atualização
    const updateData: Record<string, unknown> = { ...rest }

    // Atualiza cidade se fornecida
    if (cityId) {
      const city = await prisma.city.findUnique({ where: { id: cityId } })
      if (!city) {
        return NextResponse.json(
          { error: 'Cidade não encontrada' },
          { status: 400 }
        )
      }
      updateData.cityId = cityId
    }

    // Atualiza plano se fornecido
    if (planId) {
      const plan = await prisma.plan.findUnique({ where: { id: planId } })
      if (!plan) {
        return NextResponse.json(
          { error: 'Plano não encontrado' },
          { status: 400 }
        )
      }
      updateData.planId = planId
    }

    // Atualiza status se fornecido
    if (subscriptionStatus) {
      updateData.subscriptionStatus = subscriptionStatus
      
      // Se status não for ACTIVE, remove o plano e datas
      if (subscriptionStatus !== 'ACTIVE') {
        updateData.planId = null
        updateData.planStartDate = null
        updateData.planEndDate = null
      }
      
      // NOTA: NÃO alteramos user.isActive aqui
      // O status do assinante (Pendente/Inativo/Expirado) só afeta o que vê no painel
      // O campo user.isActive é apenas para bloqueio administrativo manual
    }

    // Atualiza o assinante
    const subscriber = await prisma.assinante.update({
      where: { id },
      data: updateData,
      include: {
        city: true,
        plan: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Assinante atualizado com sucesso', data: subscriber }
    )
  } catch (error) {
    console.error('Erro ao atualizar assinante:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir assinante
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

    // Verifica se o assinante existe
    const subscriber = await prisma.assinante.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    })

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Assinante não encontrado' },
        { status: 404 }
      )
    }

    // Não permite excluir assinante com transações
    if (subscriber._count.transactions > 0) {
      return NextResponse.json(
        { 
          error: 'Não é possível excluir este assinante pois existem transações vinculadas. Cancele a assinatura ao invés de excluir.' 
        },
        { status: 400 }
      )
    }

    // Remove o assinante e o usuário (cascade)
    await prisma.user.delete({
      where: { id: subscriber.userId },
    })

    return NextResponse.json(
      { message: 'Assinante excluído com sucesso' }
    )
  } catch (error) {
    console.error('Erro ao excluir assinante:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

