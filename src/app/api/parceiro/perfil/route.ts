import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'PARCEIRO') {
      return NextResponse.json(
        { error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    const parceiro = await prisma.parceiro.findUnique({
      where: { userId: session.user.id! },
      include: {
        city: {
          select: {
            name: true,
            state: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
    })

    if (!parceiro) {
      return NextResponse.json(
        { error: 'Parceiro nao encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: {
        id: parceiro.id,
        companyName: parceiro.companyName,
        tradeName: parceiro.tradeName,
        cnpj: parceiro.cnpj,
        category: parceiro.category,
        description: parceiro.description,
        city: parceiro.city,
        contact: parceiro.contact,
        hours: parceiro.hours,
        user: parceiro.user,
      },
    })
  } catch (error) {
    console.error('Erro ao carregar perfil:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'PARCEIRO') {
      return NextResponse.json(
        { error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    const parceiro = await prisma.parceiro.findUnique({
      where: { userId: session.user.id! },
    })

    if (!parceiro) {
      return NextResponse.json(
        { error: 'Parceiro nao encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { tradeName, description, whatsapp, phone, weekdays, saturday, sunday } = body

    // Atualiza o parceiro
    const updated = await prisma.parceiro.update({
      where: { id: parceiro.id },
      data: {
        tradeName: tradeName || parceiro.tradeName,
        description: description || parceiro.description,
        contact: {
          ...(parceiro.contact as object),
          whatsapp: whatsapp || (parceiro.contact as { whatsapp?: string }).whatsapp,
          phone: phone || (parceiro.contact as { phone?: string }).phone,
        },
        hours: {
          ...(parceiro.hours as object),
          weekdays: weekdays || (parceiro.hours as { weekdays?: string }).weekdays,
          saturday: saturday || (parceiro.hours as { saturday?: string }).saturday,
          sunday: sunday || (parceiro.hours as { sunday?: string }).sunday,
        },
      },
    })

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso',
      data: updated,
    })
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

