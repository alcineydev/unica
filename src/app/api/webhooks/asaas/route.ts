import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { verifyWebhookToken, findCustomerById } from '@/lib/asaas'
import { logger } from '@/lib/logger'

// Tipos dos eventos do Asaas
type AsaasPaymentEvent = 
  | 'PAYMENT_CREATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_UPDATED'

type AsaasSubscriptionEvent =
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_DELETED'
  | 'SUBSCRIPTION_INACTIVATED'

type AsaasEvent = AsaasPaymentEvent | AsaasSubscriptionEvent

interface AsaasPaymentData {
  id: string
  customer: string
  value: number
  netValue: number
  status: string
  billingType: string
  externalReference?: string
  confirmedDate?: string
  paymentDate?: string
  description?: string
}

interface AsaasSubscriptionData {
  id: string
  customer: string
  value: number
  status: string
  billingType: string
  externalReference?: string
  nextDueDate?: string
}

interface AsaasWebhookPayload {
  event: AsaasEvent
  payment?: AsaasPaymentData
  subscription?: AsaasSubscriptionData
}

// POST - Receber webhook do Asaas
export async function POST(request: NextRequest) {
  try {
    // Verificar token de autenticação
    const webhookToken = request.headers.get('asaas-access-token') || 
                          request.headers.get('access_token') ||
                          request.nextUrl.searchParams.get('access_token')

    if (webhookToken) {
      const isValid = await verifyWebhookToken(webhookToken)
      if (!isValid) {
        logger.warn('[WEBHOOK ASAAS] Token inválido')
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
      }
    }

    const payload: AsaasWebhookPayload = await request.json()
    
    logger.info('[WEBHOOK ASAAS] Evento recebido:', payload.event)
    logger.debug('[WEBHOOK ASAAS] Payload:', JSON.stringify(payload, null, 2))

    // Processar eventos de pagamento
    if (payload.payment) {
      await processPaymentEvent(payload.event as AsaasPaymentEvent, payload.payment)
    }

    // Processar eventos de assinatura
    if (payload.subscription) {
      await processSubscriptionEvent(payload.event as AsaasSubscriptionEvent, payload.subscription)
    }

    return NextResponse.json({ success: true, event: payload.event })

  } catch (error) {
    logger.error('[WEBHOOK ASAAS] Erro:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}

// Processar eventos de pagamento
async function processPaymentEvent(event: AsaasPaymentEvent, payment: AsaasPaymentData) {
  logger.info(`[WEBHOOK ASAAS] Processando ${event} para pagamento ${payment.id}`)

  switch (event) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED':
      await handlePaymentConfirmed(payment)
      break

    case 'PAYMENT_OVERDUE':
      await handlePaymentOverdue(payment)
      break

    case 'PAYMENT_REFUNDED':
      await handlePaymentRefunded(payment)
      break

    case 'PAYMENT_CREATED':
    case 'PAYMENT_UPDATED':
    case 'PAYMENT_DELETED':
      // Apenas log, sem ação necessária
      logger.info(`[WEBHOOK ASAAS] Evento ${event} registrado`)
      break

    default:
      logger.warn(`[WEBHOOK ASAAS] Evento não tratado: ${event}`)
  }
}

// Processar eventos de assinatura
async function processSubscriptionEvent(event: AsaasSubscriptionEvent, subscription: AsaasSubscriptionData) {
  logger.info(`[WEBHOOK ASAAS] Processando ${event} para assinatura ${subscription.id}`)

  switch (event) {
    case 'SUBSCRIPTION_INACTIVATED':
    case 'SUBSCRIPTION_DELETED':
      await handleSubscriptionCancelled(subscription)
      break

    case 'SUBSCRIPTION_CREATED':
    case 'SUBSCRIPTION_UPDATED':
      // Apenas log
      logger.info(`[WEBHOOK ASAAS] Evento ${event} registrado`)
      break

    default:
      logger.warn(`[WEBHOOK ASAAS] Evento não tratado: ${event}`)
  }
}

// ==========================================
// HANDLERS DE PAGAMENTO
// ==========================================

async function handlePaymentConfirmed(payment: AsaasPaymentData) {
  logger.info('[WEBHOOK ASAAS] Pagamento confirmado:', payment.id)

  // Buscar cliente do Asaas para obter dados
  let asaasCustomer
  try {
    asaasCustomer = await findCustomerById(payment.customer)
  } catch (error) {
    logger.error('[WEBHOOK ASAAS] Erro ao buscar cliente no Asaas:', error)
    return
  }
  
  if (!asaasCustomer) {
    logger.error('[WEBHOOK ASAAS] Cliente não encontrado no Asaas:', payment.customer)
    return
  }

  // Extrair planId da externalReference (formato: unica_PLANID_TIMESTAMP)
  const externalRef = payment.externalReference || ''
  const planIdMatch = externalRef.match(/unica_(.+)_\d+/)
  const planId = planIdMatch?.[1]

  if (!planId) {
    logger.error('[WEBHOOK ASAAS] planId não encontrado na referência:', externalRef)
    return
  }

  // Buscar plano
  const plan = await prisma.plan.findUnique({ where: { id: planId } })
  
  if (!plan) {
    logger.error('[WEBHOOK ASAAS] Plano não encontrado:', planId)
    return
  }

  // Verificar se usuário já existe
  let user = await prisma.user.findUnique({
    where: { email: asaasCustomer.email }
  })

  let assinante = null
  let tempPassword = ''
  const isNewUser = !user

  if (!user) {
    // Criar novo usuário
    tempPassword = generateTempPassword()
    const hashedPassword = await hash(tempPassword, 12)

    user = await prisma.user.create({
      data: {
        email: asaasCustomer.email,
        password: hashedPassword,
        role: 'ASSINANTE',
        isActive: true,
      }
    })

    // Gerar QR Code único
    const qrCode = generateQRCode()

    // Calcular datas do plano
    const now = new Date()
    const planEndDate = new Date(now)
    planEndDate.setMonth(planEndDate.getMonth() + 1)
    
    const nextBillingDate = new Date(now)
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

    // Criar assinante
    assinante = await prisma.assinante.create({
      data: {
        userId: user.id,
        name: asaasCustomer.name,
        cpf: asaasCustomer.cpfCnpj?.replace(/\D/g, '').substring(0, 11) || null,
        phone: asaasCustomer.phone || asaasCustomer.mobilePhone || null,
        planId: planId,
        qrCode: qrCode,
        subscriptionStatus: 'ACTIVE',
        planStartDate: now,
        planEndDate: planEndDate,
        nextBillingDate: nextBillingDate,
        lastPaymentDate: now,
        points: 0,
        cashback: 0,
      }
    })

    logger.info('[WEBHOOK ASAAS] Novo usuário e assinante criados:', user.email)

    // Enviar notificações para novo usuário
    await sendWelcomeNotifications(asaasCustomer, plan, tempPassword)

  } else {
    // Usuário existente - verificar/atualizar assinante
    assinante = await prisma.assinante.findUnique({
      where: { userId: user.id }
    })

    const now = new Date()
    const planEndDate = new Date(now)
    planEndDate.setMonth(planEndDate.getMonth() + 1)
    
    const nextBillingDate = new Date(now)
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

    if (assinante) {
      // Atualizar plano e status
      assinante = await prisma.assinante.update({
        where: { id: assinante.id },
        data: {
          planId: planId,
          subscriptionStatus: 'ACTIVE',
          planStartDate: now,
          planEndDate: planEndDate,
          nextBillingDate: nextBillingDate,
          lastPaymentDate: now,
        }
      })
      logger.info('[WEBHOOK ASAAS] Assinante atualizado:', assinante.id)
    } else {
      // Criar assinante para usuário existente
      const qrCode = generateQRCode()
      
      assinante = await prisma.assinante.create({
        data: {
          userId: user.id,
          name: asaasCustomer.name,
          cpf: asaasCustomer.cpfCnpj?.replace(/\D/g, '').substring(0, 11) || null,
          phone: asaasCustomer.phone || asaasCustomer.mobilePhone || null,
          planId: planId,
          qrCode: qrCode,
          subscriptionStatus: 'ACTIVE',
          planStartDate: now,
          planEndDate: planEndDate,
          nextBillingDate: nextBillingDate,
          lastPaymentDate: now,
          points: 0,
          cashback: 0,
        }
      })
      logger.info('[WEBHOOK ASAAS] Assinante criado para usuário existente:', assinante.id)
    }

    // Enviar notificação de renovação
    await sendRenewalNotifications(asaasCustomer, plan)
  }

  // Registrar transação de pagamento
  await prisma.transaction.create({
    data: {
      type: 'BONUS', // Usando BONUS para representar pagamento de assinatura
      assinanteId: assinante.id,
      amount: payment.value,
      description: `Pagamento ${plan.name} - Asaas #${payment.id}`,
      status: 'COMPLETED',
      metadata: {
        asaasPaymentId: payment.id,
        asaasCustomerId: payment.customer,
        billingType: payment.billingType,
        externalReference: payment.externalReference,
        confirmedDate: payment.confirmedDate,
        paymentDate: payment.paymentDate,
        isNewUser: isNewUser
      }
    }
  })

  // Criar notificação para o assinante
  await prisma.assinanteNotificacao.create({
    data: {
      assinanteId: assinante.id,
      tipo: 'INFO',
      titulo: isNewUser ? '🎉 Bem-vindo ao UNICA!' : '✅ Pagamento Confirmado',
      mensagem: isNewUser 
        ? `Sua assinatura do plano ${plan.name} foi ativada com sucesso!`
        : `Seu pagamento do plano ${plan.name} foi confirmado!`,
      dados: {
        planId: plan.id,
        planName: plan.name,
        paymentId: payment.id
      }
    }
  })

  logger.info('[WEBHOOK ASAAS] Pagamento processado com sucesso!')
}

async function handlePaymentOverdue(payment: AsaasPaymentData) {
  logger.info('[WEBHOOK ASAAS] Pagamento vencido:', payment.id)

  // Buscar assinante pela transação
  const existingTransaction = await prisma.transaction.findFirst({
    where: { 
      metadata: {
        path: ['asaasPaymentId'],
        equals: payment.id
      }
    },
    include: { assinante: true }
  })

  if (existingTransaction?.assinante) {
    // Marcar como pendente (não cancela imediatamente)
    await prisma.assinante.update({
      where: { id: existingTransaction.assinante.id },
      data: {
        subscriptionStatus: 'PENDING',
      }
    })

    // Notificar assinante
    await prisma.assinanteNotificacao.create({
      data: {
        assinanteId: existingTransaction.assinante.id,
        tipo: 'INFO',
        titulo: '⚠️ Pagamento Pendente',
        mensagem: 'Seu pagamento está pendente. Por favor, regularize para continuar aproveitando os benefícios.',
        dados: { paymentId: payment.id }
      }
    })

    logger.info('[WEBHOOK ASAAS] Status do assinante alterado para PENDING')
  }
}

async function handlePaymentRefunded(payment: AsaasPaymentData) {
  logger.info('[WEBHOOK ASAAS] Pagamento estornado:', payment.id)

  // Buscar transação pelo paymentId
  const existingTransaction = await prisma.transaction.findFirst({
    where: { 
      metadata: {
        path: ['asaasPaymentId'],
        equals: payment.id
      }
    }
  })

  if (existingTransaction) {
    await prisma.transaction.update({
      where: { id: existingTransaction.id },
      data: {
        status: 'CANCELLED',
        metadata: {
          ...(existingTransaction.metadata as object || {}),
          refundedAt: new Date().toISOString()
        }
      }
    })
    logger.info('[WEBHOOK ASAAS] Transação marcada como cancelada')
  }
}

async function handleSubscriptionCancelled(subscription: AsaasSubscriptionData) {
  logger.info('[WEBHOOK ASAAS] Assinatura cancelada:', subscription.id)

  // Buscar assinante pela referência externa
  const externalRef = subscription.externalReference || ''
  logger.info('[WEBHOOK ASAAS] Referência:', externalRef)
  
  // Por enquanto, apenas log - o cancelamento efetivo pode ser feito 
  // quando o último pagamento vencer
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function generateTempPassword(): string {
  // Gera senha temporária de 8 caracteres
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function generateQRCode(): string {
  // Gera código QR único
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `UNICA-${timestamp}-${random}`.toUpperCase()
}

async function sendWelcomeNotifications(customer: { name: string; email: string; phone?: string; mobilePhone?: string }, plan: { name: string }, tempPassword: string) {
  try {
    // Enviar WhatsApp de boas-vindas
    const phone = customer.phone || customer.mobilePhone
    if (phone) {
      // Verificar se Evolution API está configurada
      const evolutionConfig = await prisma.config.findFirst({
        where: { key: 'evolution_api_url' }
      })

      if (evolutionConfig?.value) {
        const evolutionApiKey = await prisma.config.findFirst({
          where: { key: 'evolution_api_key' }
        })
        const evolutionInstance = await prisma.config.findFirst({
          where: { key: 'evolution_instance' }
        })

        if (evolutionApiKey?.value && evolutionInstance?.value) {
          const message = `🎉 *Bem-vindo ao UNICA Benefícios!*\n\n` +
            `Olá ${customer.name}!\n\n` +
            `Sua assinatura do plano *${plan.name}* foi ativada com sucesso!\n\n` +
            `📧 *Seus dados de acesso:*\n` +
            `Email: ${customer.email}\n` +
            `Senha temporária: ${tempPassword}\n\n` +
            `Acesse: https://app.unicabeneficios.com.br\n\n` +
            `Recomendamos trocar sua senha no primeiro acesso.\n\n` +
            `Obrigado por fazer parte do UNICA! 💜`

          await fetch(`${evolutionConfig.value}/message/sendText/${evolutionInstance.value}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey.value
            },
            body: JSON.stringify({
              number: `55${phone.replace(/\D/g, '')}`,
              text: message
            })
          })
          
          logger.info('[WEBHOOK ASAAS] WhatsApp de boas-vindas enviado')
        }
      }
    }
  } catch (error) {
    logger.error('[WEBHOOK ASAAS] Erro ao enviar notificações:', error)
  }
}

async function sendRenewalNotifications(customer: { name: string; phone?: string; mobilePhone?: string }, plan: { name: string }) {
  try {
    const phone = customer.phone || customer.mobilePhone
    if (phone) {
      const evolutionConfig = await prisma.config.findFirst({
        where: { key: 'evolution_api_url' }
      })

      if (evolutionConfig?.value) {
        const evolutionApiKey = await prisma.config.findFirst({
          where: { key: 'evolution_api_key' }
        })
        const evolutionInstance = await prisma.config.findFirst({
          where: { key: 'evolution_instance' }
        })

        if (evolutionApiKey?.value && evolutionInstance?.value) {
          const message = `✅ *Pagamento Confirmado!*\n\n` +
            `Olá ${customer.name}!\n\n` +
            `Seu pagamento do plano *${plan.name}* foi confirmado com sucesso!\n\n` +
            `Continue aproveitando todos os benefícios do UNICA! 💜`

          await fetch(`${evolutionConfig.value}/message/sendText/${evolutionInstance.value}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey.value
            },
            body: JSON.stringify({
              number: `55${phone.replace(/\D/g, '')}`,
              text: message
            })
          })
          
          logger.info('[WEBHOOK ASAAS] WhatsApp de renovação enviado')
        }
      }
    }
  } catch (error) {
    logger.error('[WEBHOOK ASAAS] Erro ao enviar notificação de renovação:', error)
  }
}

// GET - Apenas para teste
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Webhook Asaas ativo',
    timestamp: new Date().toISOString()
  })
}

