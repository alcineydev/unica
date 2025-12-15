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

    const assinante = await prisma.assinante.findFirst({
      where: { userId: session.user.id },
      include: {
        user: true,
        city: true,
        plan: true
      }
    })

    if (!assinante) {
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      id: assinante.id,
      name: assinante.name,
      cpf: assinante.cpf ?? '',
      phone: assinante.phone ?? '',
      email: assinante.user?.email ?? '',
      avatar: assinante.user?.avatar,
      city: assinante.city,
      plan: assinante.plan ? {
        name: assinante.plan.name,
        price: Number(assinante.plan.price)
      } : null,
      subscriptionStatus: assinante.subscriptionStatus,
      createdAt: assinante.createdAt.toISOString()
    })

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
      data: { phone, avatar }
    })

    // Atualiza o assinante
    await prisma.assinante.updateMany({
      where: { userId: session.user.id },
      data: { name, phone }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
