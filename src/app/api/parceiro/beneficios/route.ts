import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id }
    })

    if (!parceiro) {
      return NextResponse.json({ benefits: [] })
    }

    const benefitAccess = await prisma.benefitAccess.findMany({
      where: { parceiroId: parceiro.id },
      include: {
        benefit: true
      }
    })

    const benefits = benefitAccess.map(ba => ({
      id: ba.benefit.id,
      name: ba.benefit.name,
      type: ba.benefit.type,
      value: ba.benefit.value as Record<string, number>,
      description: ba.benefit.description,
      isActive: ba.benefit.isActive
    }))

    return NextResponse.json({ benefits })

  } catch (error) {
    console.error('Erro ao buscar benefícios:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

