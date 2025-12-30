import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const assinante = await prisma.assinante.findFirst({
      where: {
        user: {
          id: session.user.id,
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          }
        },
        plan: true,
      }
    })

    if (!assinante) {
      return NextResponse.json(
        { error: 'Assinante não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: {
        id: assinante.id,
        odontogram: assinante.odontogram,
        nome: assinante.user?.name || 'Assinante',
        email: assinante.user?.email || '',
        image: assinante.user?.image,
        plano: assinante.plan?.name || 'Sem plano',
        status: assinante.subscriptionStatus,
        validadeAssinatura: assinante.subscriptionEnd?.toISOString() || null,
      }
    })
  } catch (error) {
    console.error('Erro ao buscar carteirinha:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar carteirinha' },
      { status: 500 }
    )
  }
}
