import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
  findOrCreateCustomer,
  createPayment,
  createSubscription,
  getPixQrCode,
  calculateDueDate,
  isValidCpfCnpj
} from '@/lib/asaas'
import { AsaasBillingType } from '@/types/asaas'

interface CheckoutRequest {
  planId: string
  customer: {
    name: string
    email: string
    cpfCnpj: string
    phone: string
    // Endereço (obrigatório para boleto)
    postalCode?: string
    address?: string
    addressNumber?: string
    complement?: string
    province?: string // Bairro
    city?: string
    state?: string
  }
  billingType: AsaasBillingType
  // Para assinatura recorrente
  createSubscription?: boolean
  // Para cartão de crédito
  creditCardToken?: string
  installmentCount?: number
  remoteIp?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json()
    const { planId, customer, billingType, createSubscription: wantSubscription, creditCardToken, installmentCount, remoteIp } = body

    // Validações
    if (!planId) {
      return NextResponse.json({ error: 'Plano não informado' }, { status: 400 })
    }

    if (!customer?.name || !customer?.email || !customer?.cpfCnpj || !customer?.phone) {
      return NextResponse.json({ error: 'Dados do cliente incompletos' }, { status: 400 })
    }

    if (!isValidCpfCnpj(customer.cpfCnpj)) {
      return NextResponse.json({ error: 'CPF/CNPJ inválido' }, { status: 400 })
    }

    if (!billingType || !['PIX', 'BOLETO', 'CREDIT_CARD'].includes(billingType)) {
      return NextResponse.json({ error: 'Forma de pagamento inválida' }, { status: 400 })
    }

    // Boleto requer endereço
    if (billingType === 'BOLETO' && (!customer.postalCode || !customer.address || !customer.addressNumber)) {
      return NextResponse.json({ error: 'Endereço obrigatório para boleto' }, { status: 400 })
    }

    // Cartão requer token
    if (billingType === 'CREDIT_CARD' && !creditCardToken) {
      return NextResponse.json({ error: 'Token do cartão não informado' }, { status: 400 })
    }

    // Buscar plano
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        planBenefits: {
          include: { benefit: true }
        }
      }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    if (!plan.isActive) {
      return NextResponse.json({ error: 'Plano não está ativo' }, { status: 400 })
    }

    // Criar/buscar cliente no Asaas
    const asaasCustomer = await findOrCreateCustomer({
      name: customer.name,
      email: customer.email,
      cpfCnpj: customer.cpfCnpj.replace(/\D/g, ''),
      phone: customer.phone.replace(/\D/g, ''),
      mobilePhone: customer.phone.replace(/\D/g, ''),
      postalCode: customer.postalCode?.replace(/\D/g, ''),
      address: customer.address,
      addressNumber: customer.addressNumber,
      complement: customer.complement,
      province: customer.province,
      city: customer.city,
      state: customer.state,
      externalReference: `plan_${planId}`,
      notificationDisabled: false
    })

    // Gerar referência única
    const externalReference = `unica_${planId}_${Date.now()}`
    const description = `Assinatura ${plan.name} - UNICA Benefícios`

    let paymentResponse
    let pixData = null
    let subscriptionResponse = null

    // Criar assinatura recorrente ou cobrança única
    if (wantSubscription && billingType !== 'PIX') {
      // Assinatura recorrente (não funciona bem com PIX)
      subscriptionResponse = await createSubscription({
        customer: asaasCustomer.id,
        billingType,
        value: Number(plan.price),
        nextDueDate: calculateDueDate(0), // Começa hoje
        cycle: 'MONTHLY',
        description,
        externalReference,
        creditCardToken: billingType === 'CREDIT_CARD' ? creditCardToken : undefined,
        remoteIp
      })

      // Buscar primeira cobrança da assinatura
      // A primeira cobrança é criada automaticamente
      paymentResponse = {
        id: subscriptionResponse.id,
        status: 'PENDING' as const,
        value: Number(plan.price),
        billingType,
        dueDate: subscriptionResponse.nextDueDate,
        invoiceUrl: subscriptionResponse.paymentLink,
        bankSlipUrl: undefined
      }
    } else {
      // Cobrança única
      paymentResponse = await createPayment({
        customer: asaasCustomer.id,
        billingType,
        value: Number(plan.price),
        dueDate: calculateDueDate(billingType === 'BOLETO' ? 3 : 1),
        description,
        externalReference,
        creditCardToken: billingType === 'CREDIT_CARD' ? creditCardToken : undefined,
        installmentCount: billingType === 'CREDIT_CARD' ? installmentCount || 1 : undefined,
        remoteIp
      })

      // Se for PIX, buscar QR Code
      if (billingType === 'PIX' && paymentResponse.id) {
        pixData = await getPixQrCode(paymentResponse.id)
      }
    }

    // Log para rastreamento
    console.log('[CHECKOUT] Pagamento criado:', {
      asaasCustomerId: asaasCustomer.id,
      asaasPaymentId: paymentResponse.id,
      asaasSubscriptionId: subscriptionResponse?.id || null,
      planId,
      customerEmail: customer.email,
      billingType,
      value: Number(plan.price),
      externalReference,
      status: 'PENDING'
    })

    // Retornar dados para o frontend
    return NextResponse.json({
      success: true,
      payment: {
        id: paymentResponse.id,
        status: paymentResponse.status,
        value: paymentResponse.value,
        billingType,
        invoiceUrl: paymentResponse.invoiceUrl,
        bankSlipUrl: paymentResponse.bankSlipUrl,
        dueDate: paymentResponse.dueDate
      },
      pix: pixData ? {
        qrCode: pixData.encodedImage,
        copyPaste: pixData.payload,
        expirationDate: pixData.expirationDate
      } : null,
      subscription: subscriptionResponse ? {
        id: subscriptionResponse.id,
        status: subscriptionResponse.status,
        nextDueDate: subscriptionResponse.nextDueDate
      } : null,
      customer: {
        id: asaasCustomer.id,
        name: asaasCustomer.name,
        email: asaasCustomer.email
      },
      plan: {
        id: plan.id,
        name: plan.name,
        price: Number(plan.price)
      },
      externalReference
    })

  } catch (error) {
    console.error('[CHECKOUT] Erro:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar checkout' },
      { status: 500 }
    )
  }
}

