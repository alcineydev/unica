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
      return NextResponse.json({ validations: [] })
    }

    // Buscar transações do parceiro
    const transactions = await prisma.transaction.findMany({
      where: { 
        parceiroId: parceiro.id 
      },
      include: {
        assinante: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const validations = transactions.map(tx => ({
      id: tx.id,
      customerName: tx.assinante?.user?.name || 'Cliente',
      customerEmail: tx.assinante?.user?.email || '',
      benefitName: tx.description || 'Compra',
      amount: tx.amount,
      createdAt: tx.createdAt.toISOString()
    }))

    return NextResponse.json({ validations })

  } catch (error) {
    console.error('Erro ao buscar validações:', error)
    return NextResponse.json({ validations: [] })
  }
}

