import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const calcularSchema = z.object({
  assinanteId: z.string(),
  amount: z.number().min(1, 'Valor minimo e R$ 1,00'),
  usePoints: z.boolean(),
  pointsToUse: z.number().min(0).default(0),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'PARCEIRO') {
      return NextResponse.json(
        { error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = calcularSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { assinanteId, amount, usePoints, pointsToUse } = validation.data

    // Busca o assinante
    const assinante = await prisma.assinante.findUnique({
      where: { id: assinanteId },
      include: {
        plan: {
          include: {
            planBenefits: {
              include: {
                benefit: true,
              },
            },
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

    if (assinante.subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Assinatura inativa' },
        { status: 400 }
      )
    }

    // Calcula desconto do plano
    let discountPercentage = 0
    let cashbackPercentage = 0

    for (const pb of assinante.plan.planBenefits) {
      const value = pb.benefit.value as { percentage?: number }
      
      if (pb.benefit.type === 'DESCONTO' && value.percentage) {
        discountPercentage = value.percentage
      }
      if (pb.benefit.type === 'CASHBACK' && value.percentage) {
        cashbackPercentage = value.percentage
      }
    }

    // Calcula valores
    const discountAmount = amount * (discountPercentage / 100)
    const afterDiscount = amount - discountAmount

    // Valida pontos
    const assinantePoints = Number(assinante.points)
    const actualPointsToUse = usePoints 
      ? Math.min(pointsToUse, assinantePoints, afterDiscount) 
      : 0

    const finalAmount = Math.max(0, afterDiscount - actualPointsToUse)

    // Calcula cashback sobre o valor pago (sem pontos)
    const cashbackGenerated = (finalAmount) * (cashbackPercentage / 100)

    return NextResponse.json({
      data: {
        assinante: {
          id: assinante.id,
          name: assinante.name,
          cpf: assinante.cpf,
        },
        amount,
        discount: discountAmount,
        pointsUsed: actualPointsToUse,
        cashbackGenerated,
        finalAmount,
      },
    })
  } catch (error) {
    console.error('Erro ao calcular venda:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

