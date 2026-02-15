import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session || !['PARCEIRO', 'DEVELOPER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { assinanteId, amount, usePoints = false, pointsToUse = 0, useCashback = false } = body

    if (!assinanteId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Buscar parceiro logado
    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id },
      select: { id: true, companyName: true, tradeName: true },
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Buscar assinante com plano e benefícios
    const assinante = await prisma.assinante.findUnique({
      where: { id: assinanteId },
      include: {
        plan: {
          include: {
            planBenefits: {
              include: { benefit: true },
            },
          },
        },
      },
    })

    if (!assinante || !assinante.plan) {
      return NextResponse.json({ error: 'Assinante ou plano não encontrado' }, { status: 404 })
    }

    // Buscar benefícios que o parceiro oferece E que estão no plano do assinante
    const parceiroWithBenefits = await prisma.parceiro.findUnique({
      where: { id: parceiro.id },
      include: {
        benefitAccess: {
          include: { benefit: true },
        },
      },
    })

    const parceiroBenefitIds = parceiroWithBenefits?.benefitAccess.map(ba => ba.benefitId) || []
    const planBenefits = assinante.plan.planBenefits
      .filter(pb => parceiroBenefitIds.includes(pb.benefitId))
      .map(pb => pb.benefit)

    // Extrair percentuais com safety parse
    let discountPercent = 0
    let cashbackPercent = 0

    for (const benefit of planBenefits) {
      let rawValue = benefit.value
      if (typeof rawValue === 'string') {
        try { rawValue = JSON.parse(rawValue) } catch { rawValue = {} }
      }
      const value = (rawValue as Record<string, number>) || {}
      const pct = value.percentage || value.value || 0

      if (benefit.type === 'DESCONTO' && pct > discountPercent) {
        discountPercent = pct
      }
      if (benefit.type === 'CASHBACK' && pct > cashbackPercent) {
        cashbackPercent = pct
      }
    }

    // 1. Calcular desconto
    const discountAmount = Number((amount * discountPercent / 100).toFixed(2))
    let afterDiscount = Number((amount - discountAmount).toFixed(2))

    // 2. Calcular pontos (se usar)
    let actualPointsUsed = 0
    if (usePoints && pointsToUse > 0) {
      const availablePoints = Number(assinante.points)
      actualPointsUsed = Math.min(pointsToUse, availablePoints, afterDiscount)
      actualPointsUsed = Number(actualPointsUsed.toFixed(2))
      afterDiscount = Number((afterDiscount - actualPointsUsed).toFixed(2))
    }

    // 3. Buscar cashback disponível neste parceiro
    const cashbackBalance = await prisma.cashbackBalance.findUnique({
      where: {
        assinanteId_parceiroId: {
          assinanteId: assinante.id,
          parceiroId: parceiro.id,
        },
      },
    })

    const cashbackAvailable = Number(cashbackBalance?.balance || 0)

    // 4. Calcular cashback a usar (se escolheu usar)
    let cashbackToUse = 0
    if (useCashback && cashbackAvailable > 0) {
      cashbackToUse = Math.min(cashbackAvailable, afterDiscount)
      cashbackToUse = Number(cashbackToUse.toFixed(2))
      afterDiscount = Number((afterDiscount - cashbackToUse).toFixed(2))
    }

    // 5. Valor final
    const finalAmount = Math.max(0, afterDiscount)

    // 6. Cashback a ser gerado (sobre o valor ORIGINAL)
    const cashbackGenerated = Number((amount * cashbackPercent / 100).toFixed(2))

    const parceiroName = parceiro.tradeName || parceiro.companyName

    return NextResponse.json({
      data: {
        // Valores da compra
        originalAmount: amount,
        finalAmount,

        // Desconto
        discountPercent,
        discountAmount,

        // Pontos
        pointsAvailable: Number(assinante.points),
        pointsUsed: actualPointsUsed,

        // Cashback disponível neste parceiro
        cashbackAvailable,
        cashbackToUse,

        // Cashback que será gerado
        cashbackPercent,
        cashbackGenerated,

        // Novo saldo cashback após transação
        cashbackNewBalance: Number((cashbackAvailable - cashbackToUse + cashbackGenerated).toFixed(2)),

        // Info
        assinanteName: assinante.name,
        planName: assinante.plan.name,
        parceiroName,
      },
    })
  } catch (error) {
    console.error('Erro ao calcular venda:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
