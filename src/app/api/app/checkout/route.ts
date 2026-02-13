import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

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
      where: { id: planId },
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Plano não encontrado ou inativo' }, { status: 404 })
    }

    // Buscar assinante
    const assinante = await prisma.assinante.findUnique({
      where: { userId: session.user.id },
    })

    if (!assinante) {
      return NextResponse.json(
        { error: 'Assinante não encontrado. Complete seu cadastro primeiro.' },
        { status: 400 }
      )
    }

    // Verificar se já tem esse plano ativo
    if (
      assinante.planId === plan.id &&
      assinante.subscriptionStatus === 'ACTIVE'
    ) {
      return NextResponse.json(
        { error: 'Você já possui este plano ativo' },
        { status: 400 }
      )
    }

    const price = Number(plan.priceMonthly || plan.price)

    // ==========================================
    // PLANO GRATUITO - Ativa direto
    // ==========================================
    if (price <= 0) {
      await prisma.assinante.update({
        where: { id: assinante.id },
        data: {
          planId: plan.id,
          subscriptionStatus: 'ACTIVE',
          planStartDate: new Date(),
          planEndDate: null, // Gratuito não expira
        },
      })

      return NextResponse.json({
        success: true,
        message: `Plano ${plan.name} ativado com sucesso!`,
        redirect: '/app',
      })
    }

    // ==========================================
    // PLANO PAGO - Redireciona para checkout Asaas
    // ==========================================
    if (plan.slug) {
      return NextResponse.json({
        success: true,
        checkoutUrl: `/checkout/${plan.slug}`,
        message: 'Redirecionando para o pagamento...',
      })
    }

    // Plano pago sem slug configurado
    return NextResponse.json(
      {
        error:
          'Este plano ainda não possui checkout configurado. Entre em contato com o suporte.',
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('[APP CHECKOUT]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
