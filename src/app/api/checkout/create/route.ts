import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planId, userId, paymentType, paymentMethod } = body

    console.log('[CHECKOUT] Iniciando:', { planId, userId, paymentType, paymentMethod })

    // Buscar plano
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    // Buscar configurações do Mercado Pago
    const mpConfig = await prisma.integration.findFirst({
      where: { type: 'PAYMENT', isActive: true }
    })

    if (!mpConfig) {
      return NextResponse.json({ error: 'Pagamento não configurado' }, { status: 500 })
    }

    const config = mpConfig.config as { accessToken?: string; mode?: string }
    const accessToken = config.accessToken

    if (!accessToken) {
      return NextResponse.json({ error: 'Token de pagamento não configurado' }, { status: 500 })
    }

    // Calcular preço
    const price = paymentType === 'yearly' && plan.priceYearly 
      ? Number(plan.priceYearly)
      : Number(plan.price)

    // Determinar URL base
    const baseUrl = process.env.NEXTAUTH_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    // Criar preferência no Mercado Pago
    const preference = {
      items: [
        {
          title: `UNICA - ${plan.name}`,
          description: paymentType === 'yearly' ? 'Assinatura Anual' : 'Assinatura Mensal',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: price
        }
      ],
      back_urls: {
        success: `${baseUrl}/checkout/success`,
        failure: `${baseUrl}/checkout/failure`,
        pending: `${baseUrl}/checkout/pending`
      },
      auto_return: 'approved',
      external_reference: JSON.stringify({ planId, userId, paymentType }),
      notification_url: `${baseUrl}/api/webhooks/mercadopago`
    }

    console.log('[CHECKOUT] Criando preferência:', preference)

    // Chamar API do Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(preference)
    })

    const mpData = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error('[CHECKOUT] Erro Mercado Pago:', mpData)
      return NextResponse.json({ error: 'Erro ao criar pagamento' }, { status: 500 })
    }

    console.log('[CHECKOUT] Preferência criada:', mpData.id)

    // Retornar URL de checkout
    const isSandbox = config.mode === 'sandbox'
    const checkoutUrl = isSandbox ? mpData.sandbox_init_point : mpData.init_point

    return NextResponse.json({
      checkoutUrl,
      preferenceId: mpData.id
    })

  } catch (error) {
    console.error('[CHECKOUT] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

