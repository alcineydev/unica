import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Ver assinantes e seus IDs Asaas
export async function GET() {
  try {
    const assinantes = await prisma.assinante.findMany({
      include: { user: true, plan: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return NextResponse.json({
      total: assinantes.length,
      assinantes: assinantes.map(a => ({
        id: a.id,
        name: a.name,
        email: a.user?.email,
        status: a.subscriptionStatus,
        userActive: a.user?.isActive,
        planName: a.plan?.name,
        asaasCustomerId: a.asaasCustomerId,
        asaasPaymentId: a.asaasPaymentId,
        asaasSubscriptionId: a.asaasSubscriptionId,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      }))
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST - Simular webhook manualmente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { asaasPaymentId, asaasCustomerId, action } = body

    if (!asaasPaymentId && !asaasCustomerId) {
      return NextResponse.json({ 
        error: 'asaasPaymentId ou asaasCustomerId é obrigatório' 
      }, { status: 400 })
    }

    // Buscar assinante
    const assinante = await prisma.assinante.findFirst({
      where: {
        OR: [
          ...(asaasPaymentId ? [{ asaasPaymentId }] : []),
          ...(asaasCustomerId ? [{ asaasCustomerId }] : [])
        ]
      },
      include: { user: true, plan: true }
    })

    if (!assinante) {
      // Listar todos para debug
      const todos = await prisma.assinante.findMany({
        select: {
          id: true,
          name: true,
          asaasPaymentId: true,
          asaasCustomerId: true,
          subscriptionStatus: true
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ 
        error: 'Assinante não encontrado',
        searched: { asaasPaymentId, asaasCustomerId },
        recentAssinantes: todos
      }, { status: 404 })
    }

    if (action === 'activate') {
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
          updatedAt: now 
        }
      })

      // Ativar usuário
      if (assinante.userId) {
        await prisma.user.update({
          where: { id: assinante.userId },
          data: { isActive: true, updatedAt: now }
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Assinante ativado manualmente',
        assinante: {
          id: assinante.id,
          name: assinante.name,
          email: assinante.user?.email,
          newStatus: 'ACTIVE'
        }
      })
    }

    return NextResponse.json({
      found: true,
      assinante: {
        id: assinante.id,
        name: assinante.name,
        email: assinante.user?.email,
        status: assinante.subscriptionStatus,
        userActive: assinante.user?.isActive,
        planName: assinante.plan?.name,
        asaasPaymentId: assinante.asaasPaymentId,
        asaasCustomerId: assinante.asaasCustomerId,
        asaasSubscriptionId: assinante.asaasSubscriptionId,
        createdAt: assinante.createdAt
      }
    })

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

