import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        assinante: {
          include: {
            city: true,
            plan: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const profileData = {
      id: user.id,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      role: user.role
    }

    // Se for assinante, adiciona dados extras
    if (user.assinante) {
      return NextResponse.json({
        ...profileData,
        name: user.assinante.name,
        cpf: user.assinante.cpf ?? '',
        phone: user.assinante.phone ?? user.phone ?? '',
        city: user.assinante.city,
        plan: user.assinante.plan ? {
          name: user.assinante.plan.name,
          price: Number(user.assinante.plan.price)
        } : null,
        subscriptionStatus: user.assinante.subscriptionStatus,
        createdAt: user.assinante.createdAt.toISOString()
      })
    }

    return NextResponse.json(profileData)

  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
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
    const { name, phone, avatar } = body

    // Atualiza o usuário
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phone,
        avatar
      }
    })

    // Se for assinante, atualiza também
    const assinante = await prisma.assinante.findFirst({
      where: { userId: session.user.id }
    })

    if (assinante) {
      await prisma.assinante.update({
        where: { id: assinante.id },
        data: {
          name,
          phone
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
