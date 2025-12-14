import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id },
      include: {
        city: true,
        user: {
          select: {
            email: true
          }
        }
      }
    })

    return NextResponse.json({ parceiro })

  } catch (error) {
    console.error('Erro ao buscar parceiro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Buscar parceiro atual
    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id }
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Atualizar parceiro
    await prisma.parceiro.update({
      where: { id: parceiro.id },
      data: {
        tradeName: body.tradeName,
        description: body.description,
        category: body.category,
        logo: body.logo,
        banner: body.banner,
        gallery: body.gallery || [],
        whatsapp: body.whatsapp,
        contact: {
          ...(parceiro.contact as object || {}),
          whatsapp: body.whatsapp,
          phone: body.phone
        },
        address: {
          ...(parceiro.address as object || {}),
          street: body.address,
          number: body.number,
          complement: body.complement,
          neighborhood: body.neighborhood,
          zipCode: body.zipCode
        },
        hours: {
          ...(parceiro.hours as object || {}),
          weekdays: body.openingHours
        }
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao atualizar parceiro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

