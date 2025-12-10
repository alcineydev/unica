import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { updatePartnerSchema } from '@/lib/validations/partner'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Buscar parceiro por ID
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

    const partner = await prisma.parceiro.findUnique({
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
        _count: {
          select: {
            transactions: true,
            benefitAccess: true,
          },
        },
      },
    })

    if (!partner) {
      return NextResponse.json(
        { error: 'Parceiro não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: partner })
  } catch (error) {
    console.error('Erro ao buscar parceiro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar parceiro
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

    const validationResult = updatePartnerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Verifica se o parceiro existe
    const existingPartner = await prisma.parceiro.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!existingPartner) {
      return NextResponse.json(
        { error: 'Parceiro não encontrado' },
        { status: 404 }
      )
    }

    const { isActive, whatsapp, phone, cityId, ...rest } = validationResult.data

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

    // Atualiza contato se fornecido
    if (whatsapp || phone !== undefined) {
      const currentContact = existingPartner.contact as Record<string, string>
      updateData.contact = {
        ...currentContact,
        ...(whatsapp && { whatsapp }),
        ...(phone !== undefined && { phone: phone || '' }),
      }
    }

    // Atualiza o parceiro
    const partner = await prisma.parceiro.update({
      where: { id },
      data: updateData,
      include: {
        city: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    })

    // Se está alterando status, atualiza também o usuário
    if (isActive !== undefined) {
      await prisma.user.update({
        where: { id: existingPartner.userId },
        data: { isActive },
      })
      
      await prisma.parceiro.update({
        where: { id },
        data: { isActive },
      })
    }

    return NextResponse.json(
      { message: 'Parceiro atualizado com sucesso', data: partner }
    )
  } catch (error) {
    console.error('Erro ao atualizar parceiro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir parceiro
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

    // Verifica se o parceiro existe
    const partner = await prisma.parceiro.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    })

    if (!partner) {
      return NextResponse.json(
        { error: 'Parceiro não encontrado' },
        { status: 404 }
      )
    }

    // Não permite excluir parceiro com transações
    if (partner._count.transactions > 0) {
      return NextResponse.json(
        { 
          error: 'Não é possível excluir este parceiro pois existem transações vinculadas. Desative o parceiro ao invés de excluir.' 
        },
        { status: 400 }
      )
    }

    // Remove o parceiro e o usuário (cascade)
    await prisma.user.delete({
      where: { id: partner.userId },
    })

    return NextResponse.json(
      { message: 'Parceiro excluído com sucesso' }
    )
  } catch (error) {
    console.error('Erro ao excluir parceiro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

