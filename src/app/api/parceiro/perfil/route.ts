import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'PARCEIRO') {
      return NextResponse.json(
        { error: 'Não autorizado' },
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
        benefitAccess: {
          include: {
            benefit: true,
          },
        },
      },
    })

    if (!parceiro) {
      return NextResponse.json(
        { error: 'Parceiro não encontrado' },
        { status: 404 }
      )
    }

    // Mapear benefícios
    const beneficios = parceiro.benefitAccess.map((ba) => ({
      id: ba.benefit.id,
      name: ba.benefit.name,
      description: ba.benefit.description,
      type: ba.benefit.type,
      value: Number(ba.benefit.value || 0),
    }))

    return NextResponse.json({
      data: {
        id: parceiro.id,
        companyName: parceiro.companyName,
        tradeName: parceiro.tradeName,
        cnpj: parceiro.cnpj,
        category: parceiro.category,
        description: parceiro.description,
        logo: parceiro.logo,
        banner: parceiro.banner,
        city: parceiro.city,
        contact: parceiro.contact,
        hours: parceiro.hours,
        address: parceiro.address,
        user: parceiro.user,
      },
      beneficios,
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
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const parceiro = await prisma.parceiro.findUnique({
      where: { userId: session.user.id! },
    })

    if (!parceiro) {
      return NextResponse.json(
        { error: 'Parceiro não encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { tradeName, description, whatsapp, phone, weekdays, saturday, sunday } = body

    // Limpar formatação dos telefones
    const cleanPhone = phone?.replace(/\D/g, '') || ''
    const cleanWhatsapp = whatsapp?.replace(/\D/g, '') || ''

    // Atualiza o parceiro
    const updated = await prisma.parceiro.update({
      where: { id: parceiro.id },
      data: {
        tradeName: tradeName || parceiro.tradeName,
        description: description || parceiro.description,
        contact: {
          ...(parceiro.contact as object),
          whatsapp: cleanWhatsapp || (parceiro.contact as { whatsapp?: string }).whatsapp,
          phone: cleanPhone || (parceiro.contact as { phone?: string }).phone,
        },
        hours: {
          ...(parceiro.hours as object),
          weekdays: weekdays !== undefined ? weekdays : (parceiro.hours as { weekdays?: string }).weekdays,
          saturday: saturday !== undefined ? saturday : (parceiro.hours as { saturday?: string }).saturday,
          sunday: sunday !== undefined ? sunday : (parceiro.hours as { sunday?: string }).sunday,
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
