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
    const wasUserActive = assinante.user?.isActive

    // Cancelar assinante (simula estorno)
    await prisma.assinante.update({
      where: { id: assinante.id },
      data: { 
        subscriptionStatus: 'CANCELED', 
        updatedAt: new Date() 
      }
    })

    // Desativar usuário
    if (assinante.userId) {
      await prisma.user.update({
        where: { id: assinante.userId },
        data: { 
          isActive: false, 
          updatedAt: new Date() 
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: '❌ Assinante cancelado (simulação de estorno)',
      assinante: {
        id: assinante.id,
        name: assinante.name,
        email: assinante.user?.email,
        plan: assinante.plan?.name,
        oldStatus,
        newStatus: 'CANCELED',
        wasUserActive,
        userActiveNow: false
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      error: String(error) 
    }, { status: 500 })
  }
}

