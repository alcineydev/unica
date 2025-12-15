import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ASSINANTE') {
      return NextResponse.json(
        { error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    // Busca o assinante
    const assinante = await prisma.assinante.findUnique({
      where: { userId: session.user.id! },
      include: {
        user: {
          select: {
            email: true,
            createdAt: true,
          },
        },
        city: {
          select: {
            name: true,
            state: true,
          },
        },
        plan: {
          select: {
            name: true,
            price: true,
          },
        },
      },
    })

    if (!assinante) {
      return NextResponse.json(
        { error: 'Assinante nao encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: {
        name: assinante.name,
        email: assinante.user.email,
        cpf: assinante.cpf,
        phone: assinante.phone,
        city: assinante.city,
        plan: assinante.plan ? {
          name: assinante.plan.name,
          price: Number(assinante.plan.price),
        } : null,
        subscriptionStatus: assinante.subscriptionStatus,
        createdAt: assinante.user.createdAt.toISOString(),
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

