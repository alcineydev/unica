import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { updateBenefitSchema, validateBenefitConfig } from '@/lib/validations/benefit'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Buscar benefício por ID
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

    const benefit = await prisma.benefit.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            planBenefits: true,
            benefitAccess: true,
          },
        },
        planBenefits: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!benefit) {
      return NextResponse.json(
        { error: 'Benefício não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: benefit })
  } catch (error) {
    console.error('Erro ao buscar benefício:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar benefício
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

    const validationResult = updateBenefitSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Verifica se o benefício existe
    const existingBenefit = await prisma.benefit.findUnique({
      where: { id },
    })

    if (!existingBenefit) {
      return NextResponse.json(
        { error: 'Benefício não encontrado' },
        { status: 404 }
      )
    }

    const { type, value, ...rest } = validationResult.data

    // Se está alterando tipo ou valor, valida a configuração
    if (type && value) {
      const configValidation = validateBenefitConfig(type, value as Record<string, unknown>)
      if (!configValidation.success) {
        return NextResponse.json(
          { error: configValidation.error },
          { status: 400 }
        )
      }
    } else if (value && !type) {
      // Se só está alterando o valor, usa o tipo existente
      const configValidation = validateBenefitConfig(
        existingBenefit.type,
        value as Record<string, unknown>
      )
      if (!configValidation.success) {
        return NextResponse.json(
          { error: configValidation.error },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = { ...rest }
    if (type) updateData.type = type
    if (value) updateData.value = value

    const benefit = await prisma.benefit.update({
      where: { id },
      data: updateData,
    })

    // Registrar log
    await logger.benefitUpdated(session.user.id!, id, benefit.name)

    return NextResponse.json(
      { message: 'Benefício atualizado com sucesso', data: benefit }
    )
  } catch (error) {
    console.error('Erro ao atualizar benefício:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir benefício
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

    // Verifica se o benefício existe
    const benefit = await prisma.benefit.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            planBenefits: true,
          },
        },
      },
    })

    if (!benefit) {
      return NextResponse.json(
        { error: 'Benefício não encontrado' },
        { status: 404 }
      )
    }

    // Não permite excluir benefício vinculado a planos
    if (benefit._count.planBenefits > 0) {
      return NextResponse.json(
        { 
          error: 'Não é possível excluir este benefício pois está vinculado a planos. Desative o benefício ao invés de excluir.' 
        },
        { status: 400 }
      )
    }

    await prisma.benefit.delete({
      where: { id },
    })

    // Registrar log
    await logger.benefitDeleted(session.user.id!, benefit.name)

    return NextResponse.json(
      { message: 'Benefício excluído com sucesso' }
    )
  } catch (error) {
    console.error('Erro ao excluir benefício:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

