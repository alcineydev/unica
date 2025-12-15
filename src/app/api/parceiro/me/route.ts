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

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Extrair dados do contact JSON se existir
    const contact = parceiro.contact as Record<string, string> | null

    return NextResponse.json({ 
      parceiro: {
        ...parceiro,
        whatsapp: contact?.whatsapp ?? '',
        phone: contact?.phone ?? '',
        website: contact?.website ?? '',
        instagram: contact?.instagram ?? '',
        facebook: contact?.facebook ?? ''
      }
    })

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

    // Buscar parceiro atual para pegar o contact existente
    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id }
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Montar objeto contact atualizado
    const currentContact = parceiro.contact as Record<string, string> | null
    const updatedContact = {
      ...(currentContact || {}),
      whatsapp: body.whatsapp ?? currentContact?.whatsapp ?? '',
      phone: body.phone ?? currentContact?.phone ?? '',
      website: body.website ?? currentContact?.website ?? '',
      instagram: body.instagram ?? currentContact?.instagram ?? '',
      facebook: body.facebook ?? currentContact?.facebook ?? ''
    }

    // Atualizar parceiro com campos que existem no schema
    await prisma.parceiro.update({
      where: { id: parceiro.id },
      data: {
        tradeName: body.tradeName ?? parceiro.tradeName,
        description: body.description ?? parceiro.description,
        category: body.category ?? parceiro.category,
        logo: body.logo ?? parceiro.logo,
        banner: body.banner ?? parceiro.banner,
        gallery: body.gallery ?? parceiro.gallery,
        contact: updatedContact,
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao atualizar parceiro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
