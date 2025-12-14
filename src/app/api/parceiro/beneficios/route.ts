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
      ...ba.benefit,
      isActive: true
    }))

    return NextResponse.json({ benefits })

  } catch (error) {
    console.error('Erro ao buscar benefícios:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
