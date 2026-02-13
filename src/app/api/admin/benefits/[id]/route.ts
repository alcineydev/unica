import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { updateBenefitSchema, validateBenefitConfig } from '@/lib/validations/benefit'

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

    return NextResponse.json(benefit)
  } catch (error) {
    console.error('Erro ao buscar benefício:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar benefício
export async function PUT(request: Request, { params }: RouteParams) {
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
    
    // Verificar query param para forçar exclusão
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    // Verifica se o benefício existe
    const benefit = await prisma.benefit.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            planBenefits: true,
            benefitAccess: true,
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

    const hasRelations = benefit._count.planBenefits > 0 || benefit._count.benefitAccess > 0

    // Se tem vínculos e não é forçado, bloquear
    if (hasRelations && !force) {
      return NextResponse.json(
        { 
          error: `Benefício vinculado a ${benefit._count.planBenefits} plano(s) e ${benefit._count.benefitAccess} parceiro(s).`,
          details: {
            planBenefits: benefit._count.planBenefits,
            benefitAccess: benefit._count.benefitAccess,
          }
        },
        { status: 400 }
      )
    }

    // Se forçado, deletar vínculos primeiro
    if (hasRelations && force) {
      await prisma.$transaction([
        prisma.planBenefit.deleteMany({ where: { benefitId: id } }),
        prisma.benefitAccess.deleteMany({ where: { benefitId: id } }),
        prisma.benefit.delete({ where: { id } }),
      ])
    } else {
      // Sem vínculos, deletar direto
      await prisma.benefit.delete({ where: { id } })
    }

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

