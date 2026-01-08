import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { asaas } from '@/lib/asaas'
import prisma from '@/lib/prisma'
import { addDays, format } from 'date-fns'

// POST - Criar assinatura recorrente
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      planId,
      billingType,
      period, // MONTHLY, SEMIANNUALLY, YEARLY
      creditCard,
      creditCardHolderInfo
    } = body

    // Buscar assinante
    const assinante = await prisma.assinante.findFirst({
      where: { userId: session.user.id },
      include: { user: true },
    })

    if (!assinante) {
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
    }

    if (!assinante.asaasCustomerId) {
      return NextResponse.json(
        { error: 'Cliente não cadastrado no Asaas. Faça o cadastro primeiro.' },
        { status: 400 }
      )
    }

    // Buscar plano
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    // Determinar valor e ciclo
    const cycle = asaas.getCycleFromPeriod(period || plan.period)
    let value = Number(plan.price)

    // Ajustar valor baseado no período
    if (cycle === 'SEMIANNUALLY' && plan.priceSingle) {
      value = Number(plan.priceSingle)
    } else if (cycle === 'YEARLY' && plan.priceYearly) {
      value = Number(plan.priceYearly)
    } else if (plan.priceMonthly) {
      value = Number(plan.priceMonthly)
    }

    const nextDueDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')

    // Criar assinatura
    let subscription

    if (billingType === 'CREDIT_CARD' && creditCard && creditCardHolderInfo) {
      subscription = await asaas.createSubscriptionWithCreditCard(
        {
          customer: assinante.asaasCustomerId,
          billingType: 'CREDIT_CARD',
          value,
          nextDueDate,
          cycle,
          description: `Assinatura ${plan.name} - UNICA Clube`,
          externalReference: `${assinante.id}|${planId}`,
        },
        creditCard,
        creditCardHolderInfo
      )
    } else {
      subscription = await asaas.createSubscription({
        customer: assinante.asaasCustomerId,
        billingType: billingType || 'UNDEFINED', // UNDEFINED permite escolher a cada cobrança
        value,
        nextDueDate,
        cycle,
        description: `Assinatura ${plan.name} - UNICA Clube`,
        externalReference: `${assinante.id}|${planId}`,
      })
    }

    // Atualizar assinante com ID da assinatura
    await prisma.assinante.update({
      where: { id: assinante.id },
      data: {
        asaasSubscriptionId: subscription.id,
        planId: plan.id,
        subscriptionStatus: 'PENDING',
        planStartDate: new Date(),
      },
    })

    return NextResponse.json({
      subscription,
      message: 'Assinatura criada com sucesso',
    })
  } catch (error) {
    console.error('Erro ao criar assinatura:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

// DELETE - Cancelar assinatura
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('id')

    if (!subscriptionId) {
      return NextResponse.json({ error: 'ID da assinatura é obrigatório' }, { status: 400 })
    }

    await asaas.deleteSubscription(subscriptionId)

    // Atualizar assinante
    const assinante = await prisma.assinante.findFirst({
      where: { asaasSubscriptionId: subscriptionId },
    })

    if (assinante) {
      await prisma.assinante.update({
        where: { id: assinante.id },
        data: {
          subscriptionStatus: 'CANCELED',
          asaasSubscriptionId: null,
        },
      })
    }

    return NextResponse.json({
      message: 'Assinatura cancelada com sucesso',
      deleted: true
    })
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
