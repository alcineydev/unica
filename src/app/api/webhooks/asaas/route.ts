import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { addMonths, addDays } from 'date-fns'

// Tipos de eventos Asaas
type AsaasEvent =
  | 'PAYMENT_CREATED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_ANTICIPATED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_DELETED'
  | 'SUBSCRIPTION_INACTIVATED'

interface AsaasWebhookPayload {
  event: AsaasEvent
  payment?: {
    id: string
    customer: string
    subscription?: string
    billingType: string
    value: number
    netValue?: number
    status: string
    dueDate: string
    paymentDate?: string
    confirmedDate?: string
    invoiceUrl?: string
    bankSlipUrl?: string
    externalReference?: string
    description?: string
  }
  subscription?: {
    id: string
    customer: string
    billingType: string
    value: number
    status: string
    nextDueDate: string
    cycle: string
    externalReference?: string
    description?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar token de autenticação (opcional mas recomendado)
    const webhookToken = request.headers.get('asaas-access-token')
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN

    if (expectedToken && webhookToken !== expectedToken) {
      console.warn('Webhook Asaas: Token inválido')
      // Não bloquear por enquanto, apenas logar
    }

    const payload: AsaasWebhookPayload = await request.json()
    const { event, payment, subscription } = payload

    console.log(`[Asaas Webhook] Evento: ${event}`, JSON.stringify(payload, null, 2))

    // Log do evento
    await logger.system(`Webhook Asaas: ${event}`, {
      event,
      paymentId: payment?.id,
      subscriptionId: subscription?.id,
    })

    switch (event) {
      // ==================== PAGAMENTOS ====================

      case 'PAYMENT_CREATED':
        if (payment) {
          await handlePaymentCreated(payment)
        }
        break

      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        if (payment) {
          await handlePaymentConfirmed(payment)
        }
        break

      case 'PAYMENT_OVERDUE':
        if (payment) {
          await handlePaymentOverdue(payment)
        }
        break

      case 'PAYMENT_REFUNDED':
        if (payment) {
          await handlePaymentRefunded(payment)
        }
        break

      case 'PAYMENT_DELETED':
        if (payment) {
          await handlePaymentDeleted(payment)
        }
        break

      // ==================== ASSINATURAS ====================

      case 'SUBSCRIPTION_CREATED':
        if (subscription) {
          await handleSubscriptionCreated(subscription)
        }
        break

      case 'SUBSCRIPTION_UPDATED':
        if (subscription) {
          await handleSubscriptionUpdated(subscription)
        }
        break

      case 'SUBSCRIPTION_DELETED':
      case 'SUBSCRIPTION_INACTIVATED':
        if (subscription) {
          await handleSubscriptionCanceled(subscription)
        }
        break

      default:
        console.log(`[Asaas Webhook] Evento não tratado: ${event}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro no webhook Asaas:', error)
    // Retornar 200 mesmo com erro para Asaas não reenviar
    return NextResponse.json({ received: true, error: 'Internal error' })
  }
}

// ==================== HANDLERS DE PAGAMENTO ====================

async function handlePaymentCreated(payment: AsaasWebhookPayload['payment']) {
  if (!payment) return

  // Verificar se já existe
  const existing = await prisma.payment.findUnique({
    where: { asaasPaymentId: payment.id },
  })

  if (existing) {
    // Atualizar status
    await prisma.payment.update({
      where: { asaasPaymentId: payment.id },
      data: {
        status: payment.status,
        invoiceUrl: payment.invoiceUrl,
        bankSlipUrl: payment.bankSlipUrl,
      },
    })
    return
  }

  // Extrair assinanteId do externalReference
  const [assinanteId, planId] = (payment.externalReference || '').split('|')

  if (!assinanteId) {
    console.warn('Payment sem externalReference válido:', payment.id)
    return
  }

  // Criar registro de pagamento
  await prisma.payment.create({
    data: {
      assinanteId,
      planId: planId || null,
      asaasPaymentId: payment.id,
      asaasCustomerId: payment.customer,
      asaasSubscriptionId: payment.subscription,
      billingType: payment.billingType,
      value: payment.value,
      status: payment.status,
      dueDate: new Date(payment.dueDate),
      invoiceUrl: payment.invoiceUrl,
      bankSlipUrl: payment.bankSlipUrl,
      description: payment.description,
      externalReference: payment.externalReference,
    },
  })
}

async function handlePaymentConfirmed(payment: AsaasWebhookPayload['payment']) {
  if (!payment) return

  // Atualizar pagamento no banco
  const paymentRecord = await prisma.payment.findUnique({
    where: { asaasPaymentId: payment.id },
  })

  if (paymentRecord) {
    await prisma.payment.update({
      where: { asaasPaymentId: payment.id },
      data: {
        status: payment.status,
        netValue: payment.netValue,
        paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : new Date(),
        confirmedDate: payment.confirmedDate ? new Date(payment.confirmedDate) : new Date(),
      },
    })
  }

  // Extrair assinanteId do externalReference
  const [assinanteId, planId] = (payment.externalReference || '').split('|')

  if (!assinanteId) {
    console.warn('Payment confirmado sem externalReference:', payment.id)
    return
  }

  // Buscar assinante
  const assinante = await prisma.assinante.findUnique({
    where: { id: assinanteId },
    include: { plan: true },
  })

  if (!assinante) {
    console.warn('Assinante não encontrado:', assinanteId)
    return
  }

  // Calcular próxima data de cobrança baseado no ciclo
  const plan = planId ? await prisma.plan.findUnique({ where: { id: planId } }) : assinante.plan
  let nextBillingDate = addMonths(new Date(), 1) // Default: mensal

  if (plan?.period) {
    switch (plan.period.toUpperCase()) {
      case 'SEMIANNUALLY':
      case 'SEMESTRAL':
        nextBillingDate = addMonths(new Date(), 6)
        break
      case 'YEARLY':
      case 'ANUAL':
        nextBillingDate = addMonths(new Date(), 12)
        break
    }
  }

  // Ativar assinante
  await prisma.assinante.update({
    where: { id: assinanteId },
    data: {
      subscriptionStatus: 'ACTIVE',
      planId: planId || assinante.planId,
      planStartDate: assinante.planStartDate || new Date(),
      planEndDate: nextBillingDate,
      nextBillingDate,
      lastPaymentDate: new Date(),
    },
  })

  // Criar notificação para admins
  await logger.system(`Pagamento confirmado: ${assinante.name} - R$ ${payment.value}`, {
    assinanteId,
    planId,
    paymentId: payment.id,
    value: payment.value,
  })

  console.log(`[Asaas] Assinante ${assinante.name} ativado com sucesso`)
}

async function handlePaymentOverdue(payment: AsaasWebhookPayload['payment']) {
  if (!payment) return

  // Atualizar pagamento
  await prisma.payment.updateMany({
    where: { asaasPaymentId: payment.id },
    data: { status: 'OVERDUE' },
  })

  // Extrair assinanteId
  const [assinanteId] = (payment.externalReference || '').split('|')

  if (!assinanteId) return

  // Buscar configuração de tolerância (dias para suspender após vencimento)
  const toleranceConfig = await prisma.config.findFirst({
    where: { key: 'payment_tolerance_days' },
  })
  const toleranceDays = toleranceConfig ? parseInt(toleranceConfig.value) : 7

  // Verificar se passou a tolerância
  const dueDate = new Date(payment.dueDate)
  const toleranceDate = addDays(dueDate, toleranceDays)

  if (new Date() > toleranceDate) {
    // Suspender assinante
    await prisma.assinante.update({
      where: { id: assinanteId },
      data: { subscriptionStatus: 'SUSPENDED' },
    })

    await logger.system(`Assinante suspenso por inadimplência`, { assinanteId })
  }
}

async function handlePaymentRefunded(payment: AsaasWebhookPayload['payment']) {
  if (!payment) return

  await prisma.payment.updateMany({
    where: { asaasPaymentId: payment.id },
    data: { status: 'REFUNDED' },
  })

  await logger.system(`Pagamento estornado: ${payment.id}`, { paymentId: payment.id })
}

async function handlePaymentDeleted(payment: AsaasWebhookPayload['payment']) {
  if (!payment) return

  await prisma.payment.updateMany({
    where: { asaasPaymentId: payment.id },
    data: { status: 'DELETED' },
  })
}

// ==================== HANDLERS DE ASSINATURA ====================

async function handleSubscriptionCreated(subscription: AsaasWebhookPayload['subscription']) {
  if (!subscription) return

  const [assinanteId] = (subscription.externalReference || '').split('|')

  if (assinanteId) {
    await prisma.assinante.update({
      where: { id: assinanteId },
      data: {
        asaasSubscriptionId: subscription.id,
        subscriptionStatus: 'PENDING',
      },
    })
  }
}

async function handleSubscriptionUpdated(subscription: AsaasWebhookPayload['subscription']) {
  if (!subscription) return

  // Buscar assinante pela subscription
  const assinante = await prisma.assinante.findFirst({
    where: { asaasSubscriptionId: subscription.id },
  })

  if (assinante) {
    // Mapear status Asaas para status interno
    let status = assinante.subscriptionStatus
    if (subscription.status === 'ACTIVE') status = 'ACTIVE'
    if (subscription.status === 'INACTIVE') status = 'INACTIVE'
    if (subscription.status === 'EXPIRED') status = 'EXPIRED'

    await prisma.assinante.update({
      where: { id: assinante.id },
      data: { subscriptionStatus: status },
    })
  }
}

async function handleSubscriptionCanceled(subscription: AsaasWebhookPayload['subscription']) {
  if (!subscription) return

  const assinante = await prisma.assinante.findFirst({
    where: { asaasSubscriptionId: subscription.id },
  })

  if (assinante) {
    await prisma.assinante.update({
      where: { id: assinante.id },
      data: {
        subscriptionStatus: 'CANCELED',
        asaasSubscriptionId: null,
      },
    })

    await logger.system(`Assinatura cancelada: ${assinante.name}`, {
      assinanteId: assinante.id,
      subscriptionId: subscription.id,
    })
  }
}
