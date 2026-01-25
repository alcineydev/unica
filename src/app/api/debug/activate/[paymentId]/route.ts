import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId é obrigatório' }, { status: 400 })
    }

    // Buscar assinante pelo asaasPaymentId
    const assinante = await prisma.assinante.findFirst({
      where: { asaasPaymentId: paymentId },
      include: { user: true, plan: true }
    })

    if (!assinante) {
      return NextResponse.json({ 
        error: 'Assinante não encontrado',
        paymentId 
      }, { status: 404 })
    }

    const oldStatus = assinante.subscriptionStatus
    const now = new Date()
    const planEndDate = new Date(now)
    planEndDate.setMonth(planEndDate.getMonth() + 1)

    // Ativar assinante
    await prisma.assinante.update({
      where: { id: assinante.id },
      data: { 
        subscriptionStatus: 'ACTIVE',
        planStartDate: now,
        planEndDate: planEndDate,
        lastPaymentDate: now,
        updatedAt: now 
      }
    })

    // Ativar usuário
    if (assinante.userId) {
      await prisma.user.update({
        where: { id: assinante.userId },
        data: { 
          isActive: true, 
          updatedAt: now 
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: '✅ Assinante ativado com sucesso!',
      assinante: {
        id: assinante.id,
        name: assinante.name,
        email: assinante.user?.email,
        plan: assinante.plan?.name,
        oldStatus,
        newStatus: 'ACTIVE',
        planEndDate: planEndDate.toISOString()
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      error: String(error) 
    }, { status: 500 })
  }
}

