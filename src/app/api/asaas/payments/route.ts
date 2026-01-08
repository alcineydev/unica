import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { asaas } from '@/lib/asaas'
import prisma from '@/lib/prisma'
import { addDays, format } from 'date-fns'

// POST - Criar pagamento avulso
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

    // Determinar valor baseado no período
    let value = Number(plan.price)
    if (plan.priceMonthly) value = Number(plan.priceMonthly)

    const dueDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')

    // Criar pagamento
    let payment

    if (billingType === 'CREDIT_CARD' && creditCard && creditCardHolderInfo) {
      // Pagamento com cartão de crédito
      payment = await asaas.createPaymentWithCreditCard(
        {
          customer: assinante.asaasCustomerId,
          billingType: 'CREDIT_CARD',
          value,
          dueDate,
          description: `Assinatura ${plan.name} - UNICA Clube`,
          externalReference: `${assinante.id}|${planId}`,
        },
        creditCard,
        creditCardHolderInfo
      )
    } else {
      // Pagamento com Pix ou Boleto
      payment = await asaas.createPayment({
        customer: assinante.asaasCustomerId,
        billingType: billingType || 'PIX',
        value,
        dueDate,
        description: `Assinatura ${plan.name} - UNICA Clube`,
        externalReference: `${assinante.id}|${planId}`,
      })
    }

    // Buscar QR Code Pix se necessário
    let pixData = null
    if (billingType === 'PIX' && payment.id) {
      try {
        pixData = await asaas.getPixQrCode(payment.id)
      } catch (e) {
        console.error('Erro ao buscar QR Code Pix:', e)
      }
    }

    // Salvar pagamento no banco
    const paymentData = payment as { id: string; invoiceUrl?: string; bankSlipUrl?: string }
    await prisma.payment.create({
      data: {
        assinanteId: assinante.id,
        planId: plan.id,
        asaasPaymentId: payment.id,
        asaasCustomerId: assinante.asaasCustomerId,
        billingType: billingType || 'PIX',
        value,
        status: 'PENDING',
        dueDate: new Date(dueDate),
        invoiceUrl: paymentData.invoiceUrl,
        bankSlipUrl: paymentData.bankSlipUrl,
        pixQrCode: pixData?.encodedImage,
        pixPayload: pixData?.payload,
        description: `Assinatura ${plan.name}`,
        externalReference: `${assinante.id}|${planId}`,
      },
    })

    return NextResponse.json({
      payment,
      pixData,
      message: 'Pagamento criado com sucesso',
    })
  } catch (error) {
    console.error('Erro ao criar pagamento:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

// GET - Buscar pagamento
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('id')

    if (!paymentId) {
      return NextResponse.json({ error: 'ID do pagamento é obrigatório' }, { status: 400 })
    }

    const payment = await asaas.getPayment(paymentId)

    // Buscar QR Code se for Pix e ainda pendente
    let pixData = null
    if (payment.status === 'PENDING' && payment.billingType === 'PIX') {
      try {
        pixData = await asaas.getPixQrCode(paymentId)
      } catch (e) {
        console.error('Erro ao buscar QR Code:', e)
      }
    }

    return NextResponse.json({ payment, pixData })
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
