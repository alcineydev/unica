import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        assinante: {
          select: {
            name: true,
            cpf: true,
            phone: true,
            subscriptionStatus: true,
            city: {
              select: {
                name: true,
                state: true
              }
            },
            plan: {
              select: {
                name: true,
                price: true
              }
            },
            createdAt: true
          }
        },
        admin: {
          select: {
            name: true,
            phone: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Formatar resposta baseado no role
    let profileData = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      name: '',
      cpf: '',
      city: null as { name: string; state: string } | null,
      plan: null as { name: string; price: number } | null,
      subscriptionStatus: 'PENDING',
      createdAt: ''
    }

    if (user.assinante) {
      profileData = {
        ...profileData,
        name: user.assinante.name,
        cpf: user.assinante.cpf,
        phone: user.assinante.phone || user.phone || '',
        city: user.assinante.city,
        plan: user.assinante.plan,
        subscriptionStatus: user.assinante.subscriptionStatus,
        createdAt: user.assinante.createdAt.toISOString()
      }
    } else if (user.admin) {
      profileData = {
        ...profileData,
        name: user.admin.name,
        phone: user.admin.phone || user.phone || ''
      }
    }

    return NextResponse.json({ user: profileData })

  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, avatar } = body

    // Atualizar usuário (avatar e phone ficam no User)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phone: phone || null,
        avatar: avatar || null
      }
    })

    // Se for assinante, atualizar também o nome e phone no Assinante
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { assinante: true, admin: true }
    })

    if (user?.assinante) {
      await prisma.assinante.update({
        where: { id: user.assinante.id },
        data: {
          name: name,
          phone: phone || null
        }
      })
    } else if (user?.admin && name) {
      await prisma.admin.update({
        where: { id: user.admin.id },
        data: {
          name: name,
          phone: phone || null
        }
      })
    }

    return NextResponse.json({ 
      success: true,
      user: {
        name,
        phone,
        avatar
      }
    })

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

