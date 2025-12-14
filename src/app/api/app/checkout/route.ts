import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Forçar rota dinâmica
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { planId } = body

    if (!planId) {
      return NextResponse.json({ error: 'Plano não informado' }, { status: 400 })
    }

    // Buscar plano
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    // Se o plano tem slug, redirecionar para checkout público
    if (plan.slug) {
      return NextResponse.json({ 
        checkoutUrl: `/checkout/${plan.slug}` 
      })
    }

    // Buscar assinante
    const assinante = await prisma.assinante.findUnique({
      where: { userId: session.user.id }
    })

    if (!assinante) {
      return NextResponse.json({ 
        error: 'Assinante não encontrado. Complete seu cadastro primeiro.' 
      }, { status: 400 })
    }

    // Para planos pagos, deveria redirecionar para Mercado Pago
    // Por enquanto, simula ativação
    const price = Number(plan.priceMonthly || plan.price)
    
    if (price > 0) {
      // TODO: Integrar com Mercado Pago
      // Por enquanto, ativa direto para teste
      await prisma.assinante.update({
        where: { id: assinante.id },
        data: {
          planId: plan.id,
          subscriptionStatus: 'ACTIVE',
          planStartDate: new Date(),
          planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 dias
        }
      })

      return NextResponse.json({ 
        success: true,
        message: 'Plano ativado com sucesso! (Modo de teste)'
      })
    }

    // Plano gratuito - ativa diretamente
    await prisma.assinante.update({
      where: { id: assinante.id },
      data: {
        planId: plan.id,
        subscriptionStatus: 'ACTIVE',
        planStartDate: new Date()
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Plano ativado com sucesso!'
    })

  } catch (error) {
    console.error('Erro no checkout:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

