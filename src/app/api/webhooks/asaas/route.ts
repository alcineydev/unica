import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { findCustomerById } from '@/lib/asaas'
import { logger } from '@/lib/logger'
import { 
  notifyNewSubscriber, 
  notifyPaymentConfirmed, 
  notifyPaymentOverdue,
  sendPushToSubscriber,
  sendPushToAdmins
} from '@/lib/push-notifications'
import { getEmailService } from '@/services/email'

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
    logger.info('[WEBHOOK ASAAS] ========== RECEBENDO WEBHOOK ==========')
    
    // Log de headers relevantes para debug
    const relevantHeaders: Record<string, string> = {}
    const headerKeys = ['asaas-access-token', 'access_token', 'x-access-token', 'authorization', 'content-type', 'user-agent']
    headerKeys.forEach(key => {
      const value = request.headers.get(key)
      if (value) {
        relevantHeaders[key] = key.toLowerCase().includes('token') || key === 'authorization' 
          ? `${value.substring(0, 15)}...` 
          : value
      }
    })
    logger.debug('[WEBHOOK ASAAS] Headers:', JSON.stringify(relevantHeaders))

    // Buscar token configurado no banco
    const webhookTokenConfig = await prisma.config.findUnique({
      where: { key: 'asaas_webhook_token' }
    })
    const savedToken = webhookTokenConfig?.value?.trim() || ''

    // Pegar token da requisição (várias formas possíveis)
    const headerToken = request.headers.get('asaas-access-token') || 
                        request.headers.get('access_token') ||
                        request.headers.get('x-access-token') ||
                        request.headers.get('authorization')?.replace('Bearer ', '')
    const queryToken = request.nextUrl.searchParams.get('access_token')
    const receivedToken = (headerToken || queryToken || '').trim()

    logger.info('[WEBHOOK ASAAS] Token salvo no banco:', savedToken ? 'SIM' : 'NÃO')
    logger.info('[WEBHOOK ASAAS] Token recebido na requisição:', receivedToken ? 'SIM' : 'NÃO')

    // Validação flexível do token:
    // - Se não houver token configurado → aceita tudo
    // - Se houver token configurado mas não recebido → aceita (Asaas nem sempre envia)
    // - Se ambos existirem e não corresponderem → loga warning mas ACEITA (para debug)
    if (savedToken && receivedToken && savedToken !== receivedToken) {
      logger.warn('[WEBHOOK ASAAS] Token não corresponde!')
      logger.warn('[WEBHOOK ASAAS] Esperado:', savedToken.substring(0, 10) + '...')
      logger.warn('[WEBHOOK ASAAS] Recebido:', receivedToken.substring(0, 10) + '...')
      // NOTA: Por enquanto, NÃO retornar 401 para permitir debug
      // Quando estiver funcionando, descomentar a linha abaixo:
      // return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Parsear payload
    const payload: AsaasWebhookPayload = await request.json()
    
    logger.info('[WEBHOOK ASAAS] Evento:', payload.event)
    if (payload.payment) {
      logger.info('[WEBHOOK ASAAS] Payment ID:', payload.payment.id, '| Status:', payload.payment.status)
    }

    // Processar eventos de pagamento
    if (payload.payment) {
      await processPaymentEvent(payload.event as AsaasPaymentEvent, payload.payment)
    }

    // Processar eventos de assinatura
    if (payload.subscription) {
      await processSubscriptionEvent(payload.event as AsaasSubscriptionEvent, payload.subscription)
    }

    logger.info('[WEBHOOK ASAAS] ========== WEBHOOK PROCESSADO ==========')
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

    case 'PAYMENT_DELETED':
      await handlePaymentDeleted(payment)
      break

    case 'PAYMENT_CREATED':
    case 'PAYMENT_UPDATED':
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

  // PRIMEIRO: Tentar encontrar assinante já criado no checkout (pelos campos Asaas)
  let assinante = await prisma.assinante.findFirst({
    where: {
      OR: [
        { asaasPaymentId: payment.id },
        { asaasCustomerId: payment.customer }
      ]
    },
    include: { user: true, plan: true }
  })

  // Se encontrou assinante criado no checkout, apenas ativar
  if (assinante) {
    logger.info('[WEBHOOK ASAAS] Assinante encontrado (criado no checkout):', assinante.id)
    
    const now = new Date()
    const planEndDate = new Date(now)
    planEndDate.setMonth(planEndDate.getMonth() + 1)
    const nextBillingDate = new Date(now)
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

    // Ativar assinante
    await prisma.assinante.update({
      where: { id: assinante.id },
      data: {
        subscriptionStatus: 'ACTIVE',
        planStartDate: now,
        planEndDate: planEndDate,
        nextBillingDate: nextBillingDate,
        lastPaymentDate: now,
        asaasPaymentId: payment.id,
      }
    })

    // Ativar usuário
    await prisma.user.update({
      where: { id: assinante.userId },
      data: { isActive: true }
    })

    logger.info('[WEBHOOK ASAAS] Assinante e usuário ativados:', assinante.id)

    // Registrar transação
    await prisma.transaction.create({
      data: {
        type: 'BONUS',
        assinanteId: assinante.id,
        amount: payment.value,
        description: `Pagamento ${assinante.plan?.name || 'Plano'} - Asaas #${payment.id}`,
        status: 'COMPLETED',
        metadata: {
          asaasPaymentId: payment.id,
          asaasCustomerId: payment.customer,
          billingType: payment.billingType,
          externalReference: payment.externalReference,
          confirmedDate: payment.confirmedDate,
        }
      }
    })

    // Notificação para o assinante
    await prisma.assinanteNotificacao.create({
      data: {
        assinanteId: assinante.id,
        tipo: 'INFO',
        titulo: '🎉 Bem-vindo ao UNICA!',
        mensagem: `Sua assinatura do plano ${assinante.plan?.name} foi ativada com sucesso!`,
        dados: { planId: assinante.planId, paymentId: payment.id }
      }
    })

    // Enviar WhatsApp de boas-vindas
    if (assinante.plan) {
      const tempPassword = generateTempPassword()
      // Atualizar senha do usuário
      const hashedPassword = await hash(tempPassword, 12)
      await prisma.user.update({
        where: { id: assinante.userId },
        data: { password: hashedPassword }
      })

      await sendWelcomeNotifications(
        { name: assinante.name, email: assinante.user.email, phone: assinante.phone || undefined },
        { name: assinante.plan.name },
        tempPassword,
        true // isNewUser
      )
    }

    // Push para admins - Novo pagamento recebido
    try {
      await notifyPaymentConfirmed(assinante.name, Number(payment.value))
      logger.info('[WEBHOOK ASAAS] Push enviado para admins')
    } catch (pushError) {
      logger.error('[WEBHOOK ASAAS] Erro ao enviar push para admins:', pushError)
    }

    // Push de boas-vindas para o assinante
    try {
      await sendPushToSubscriber(
        assinante.id,
        '🎉 Bem-vindo ao UNICA!',
        `Seu plano ${assinante.plan?.name || 'UNICA'} está ativo. Aproveite seus benefícios!`,
        '/app/beneficios',
        'PAYMENT_CONFIRMED'
      )
      logger.info('[WEBHOOK ASAAS] Push enviado para assinante')
    } catch (pushError) {
      logger.error('[WEBHOOK ASAAS] Erro ao enviar push para assinante:', pushError)
    }

    logger.info('[WEBHOOK ASAAS] Pagamento processado com sucesso (assinante existente)!')
    return
  }

  // FALLBACK: Assinante não foi criado no checkout, criar agora (fluxo antigo)
  logger.info('[WEBHOOK ASAAS] Assinante não encontrado, criando novo...')

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

  // Buscar plano por ID ou slug
  const plan = await prisma.plan.findFirst({ 
    where: { 
      OR: [
        { id: planId },
        { slug: planId }
      ]
    } 
  })
  
  if (!plan) {
    logger.error('[WEBHOOK ASAAS] Plano não encontrado:', planId)
    return
  }

  // Verificar se usuário já existe
  let user = await prisma.user.findUnique({
    where: { email: asaasCustomer.email }
  })

  let novoAssinante: { id: string } | null = null
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
    novoAssinante = await prisma.assinante.create({
      data: {
        userId: user.id,
        name: asaasCustomer.name,
        cpf: asaasCustomer.cpfCnpj?.replace(/\D/g, '').substring(0, 11) || null,
        phone: asaasCustomer.phone || asaasCustomer.mobilePhone || null,
        planId: plan.id,
        qrCode: qrCode,
        subscriptionStatus: 'ACTIVE',
        planStartDate: now,
        planEndDate: planEndDate,
        nextBillingDate: nextBillingDate,
        lastPaymentDate: now,
        asaasCustomerId: payment.customer,
        asaasPaymentId: payment.id,
        points: 0,
        cashback: 0,
      }
    })

    logger.info('[WEBHOOK ASAAS] Novo usuário e assinante criados:', user.email)

    // Enviar notificações para novo usuário
    await sendWelcomeNotifications(asaasCustomer, plan, tempPassword, true)

  } else {
    // Usuário existente - verificar/atualizar assinante
    const existingAssinante = await prisma.assinante.findUnique({
      where: { userId: user.id }
    })

    const now = new Date()
    const planEndDate = new Date(now)
    planEndDate.setMonth(planEndDate.getMonth() + 1)
    
    const nextBillingDate = new Date(now)
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

    if (existingAssinante) {
      // Atualizar plano e status
      novoAssinante = await prisma.assinante.update({
        where: { id: existingAssinante.id },
        data: {
          planId: plan.id,
          subscriptionStatus: 'ACTIVE',
          planStartDate: now,
          planEndDate: planEndDate,
          nextBillingDate: nextBillingDate,
          lastPaymentDate: now,
          asaasCustomerId: payment.customer,
          asaasPaymentId: payment.id,
        }
      })
      logger.info('[WEBHOOK ASAAS] Assinante atualizado:', novoAssinante.id)
    } else {
      // Criar assinante para usuário existente
      const qrCode = generateQRCode()
      
      novoAssinante = await prisma.assinante.create({
        data: {
          userId: user.id,
          name: asaasCustomer.name,
          cpf: asaasCustomer.cpfCnpj?.replace(/\D/g, '').substring(0, 11) || null,
          phone: asaasCustomer.phone || asaasCustomer.mobilePhone || null,
          planId: plan.id,
          qrCode: qrCode,
          subscriptionStatus: 'ACTIVE',
          planStartDate: now,
          planEndDate: planEndDate,
          nextBillingDate: nextBillingDate,
          lastPaymentDate: now,
          asaasCustomerId: payment.customer,
          asaasPaymentId: payment.id,
          points: 0,
          cashback: 0,
        }
      })
      logger.info('[WEBHOOK ASAAS] Assinante criado para usuário existente:', novoAssinante.id)
    }

    // Enviar notificação de renovação
    await sendRenewalNotifications(asaasCustomer, plan)
  }

  if (!novoAssinante) {
    logger.error('[WEBHOOK ASAAS] Erro: assinante não foi criado')
    return
  }

  // Registrar transação de pagamento
  await prisma.transaction.create({
    data: {
      type: 'BONUS', // Usando BONUS para representar pagamento de assinatura
      assinanteId: novoAssinante.id,
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
      assinanteId: novoAssinante.id,
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

  // Push para admins - Novo assinante ou pagamento recebido
  try {
    if (isNewUser) {
      await notifyNewSubscriber(asaasCustomer.name, plan.name)
    } else {
      await notifyPaymentConfirmed(asaasCustomer.name, Number(payment.value))
    }
    logger.info('[WEBHOOK ASAAS] Push enviado para admins')
  } catch (pushError) {
    logger.error('[WEBHOOK ASAAS] Erro ao enviar push para admins:', pushError)
  }

  // Push para o assinante
  try {
    await sendPushToSubscriber(
      novoAssinante.id,
      isNewUser ? '🎉 Bem-vindo ao UNICA!' : '✅ Pagamento Confirmado',
      isNewUser 
        ? `Seu plano ${plan.name} está ativo. Aproveite seus benefícios!`
        : `Seu pagamento do plano ${plan.name} foi confirmado!`,
      '/app/beneficios',
      isNewUser ? 'NEW_SUBSCRIBER' : 'PAYMENT_CONFIRMED'
    )
    logger.info('[WEBHOOK ASAAS] Push enviado para assinante')
  } catch (pushError) {
    logger.error('[WEBHOOK ASAAS] Erro ao enviar push para assinante:', pushError)
  }

  logger.info('[WEBHOOK ASAAS] Pagamento processado com sucesso!')
}

async function handlePaymentOverdue(payment: AsaasPaymentData) {
  logger.info('[WEBHOOK ASAAS] Pagamento vencido:', payment.id)

  // Buscar assinante pelos campos Asaas
  let assinante = await prisma.assinante.findFirst({
    where: {
      OR: [
        { asaasPaymentId: payment.id },
        { asaasCustomerId: payment.customer }
      ]
    },
    include: { user: true, plan: true }
  })

  // Fallback: buscar pela transação
  if (!assinante) {
    const existingTransaction = await prisma.transaction.findFirst({
      where: { 
        metadata: {
          path: ['asaasPaymentId'],
          equals: payment.id
        }
      },
      include: { 
        assinante: {
          include: { user: true, plan: true }
        } 
      }
    })
    assinante = existingTransaction?.assinante || null
  }

  if (assinante) {
    // Marcar como suspenso (pagamento vencido)
    await prisma.assinante.update({
      where: { id: assinante.id },
      data: {
        subscriptionStatus: 'SUSPENDED',
      }
    })

    // Notificar assinante (no banco)
    await prisma.assinanteNotificacao.create({
      data: {
        assinanteId: assinante.id,
        tipo: 'INFO',
        titulo: '⚠️ Pagamento Vencido',
        mensagem: 'Seu pagamento venceu. Por favor, regularize para continuar aproveitando os benefícios.',
        dados: { paymentId: payment.id }
      }
    })

    logger.info('[WEBHOOK ASAAS] Status do assinante alterado para SUSPENDED:', assinante.id)

    // Push para admins - Pagamento vencido
    try {
      await notifyPaymentOverdue(assinante.name, Number(payment.value))
      logger.info('[WEBHOOK ASAAS] Push de vencimento enviado para admins')
    } catch (pushError) {
      logger.error('[WEBHOOK ASAAS] Erro ao enviar push de vencimento:', pushError)
    }

    // Push para assinante
    try {
      await sendPushToSubscriber(
        assinante.id,
        '⚠️ Pagamento Vencido',
        'Seu pagamento venceu. Regularize para continuar aproveitando seus benefícios.',
        '/app/perfil',
        'PAYMENT_OVERDUE'
      )
      logger.info('[WEBHOOK ASAAS] Push de vencimento enviado para assinante')
    } catch (pushError) {
      logger.error('[WEBHOOK ASAAS] Erro ao enviar push para assinante:', pushError)
    }

    // Email para assinante sobre vencimento
    if (assinante.user?.email) {
      try {
        const emailService = getEmailService()
        if (emailService) {
          await emailService.sendPaymentReminderEmail(assinante.user.email, {
            name: assinante.name,
            dueDate: new Date().toLocaleDateString('pt-BR'),
            amount: Number(payment.value)
          })
          logger.info('[WEBHOOK ASAAS] Email de vencimento enviado')
        }
      } catch (emailError) {
        logger.error('[WEBHOOK ASAAS] Erro ao enviar email de vencimento:', emailError)
      }
    }
  } else {
    logger.warn('[WEBHOOK ASAAS] Assinante não encontrado para pagamento vencido:', payment.id)
  }
}

async function handlePaymentRefunded(payment: AsaasPaymentData) {
  logger.info('[WEBHOOK ASAAS] Pagamento estornado:', payment.id)

  // Buscar assinante pelo asaasPaymentId ou asaasCustomerId
  const assinante = await prisma.assinante.findFirst({
    where: {
      OR: [
        { asaasPaymentId: payment.id },
        { asaasCustomerId: payment.customer }
      ]
    },
    include: { user: true, plan: true }
  })

  if (assinante) {
    // Cancelar assinante
    await prisma.assinante.update({
      where: { id: assinante.id },
      data: {
        subscriptionStatus: 'CANCELED',
        updatedAt: new Date()
      }
    })
    logger.info('[WEBHOOK ASAAS] Assinante cancelado por estorno:', assinante.id)

    // Desativar usuário
    if (assinante.userId) {
      await prisma.user.update({
        where: { id: assinante.userId },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      })
      logger.info('[WEBHOOK ASAAS] Usuário desativado:', assinante.userId)
    }

    // Notificar admins (no banco)
    try {
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN', isActive: true }
      })
      if (admin) {
        await prisma.adminPushNotification.create({
          data: {
            title: '⚠️ Pagamento Estornado',
            message: `Assinante ${assinante.name} teve pagamento estornado e foi cancelado. PaymentId: ${payment.id}`,
            targetType: 'ALL',
            createdBy: admin.id
          }
        })
      }
    } catch (notifError) {
      logger.warn('[WEBHOOK ASAAS] Erro ao criar notificação no banco:', notifError)
    }

    // Push para admins - Estorno
    try {
      await sendPushToAdmins(
        '⚠️ Pagamento Estornado',
        `${assinante.name} solicitou estorno de R$ ${Number(payment.value).toFixed(2)}`,
        '/admin/assinantes',
        'PAYMENT_OVERDUE'
      )
      logger.info('[WEBHOOK ASAAS] Push de estorno enviado para admins')
    } catch (pushError) {
      logger.error('[WEBHOOK ASAAS] Erro ao enviar push de estorno:', pushError)
    }

    // Email para assinante sobre cancelamento
    if (assinante.user?.email) {
      try {
        const emailService = getEmailService()
        if (emailService) {
          await emailService.sendEmail({
            to: assinante.user.email,
            subject: '⚠️ Sua assinatura foi cancelada - UNICA Benefícios',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                  .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>⚠️ Assinatura Cancelada</h1>
                  </div>
                  <div class="content">
                    <p>Olá, <strong>${assinante.name}</strong>,</p>
                    <p>Informamos que sua assinatura foi cancelada devido ao estorno do pagamento.</p>
                    <p>Se isso foi um engano ou você deseja reativar sua assinatura, acesse nosso site.</p>
                    <p><a href="https://app.unicabeneficios.com.br/planos">Ver planos disponíveis</a></p>
                    <br>
                    <p>Atenciosamente,<br><strong>Equipe UNICA Benefícios</strong></p>
                  </div>
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} UNICA Clube de Benefícios - Grupo Zan Norte</p>
                  </div>
                </div>
              </body>
              </html>
            `
          })
          logger.info('[WEBHOOK ASAAS] Email de cancelamento enviado')
        }
      } catch (emailError) {
        logger.error('[WEBHOOK ASAAS] Erro ao enviar email de cancelamento:', emailError)
      }
    }
  } else {
    logger.warn('[WEBHOOK ASAAS] Assinante não encontrado para estorno:', payment.id)
  }

  // Buscar e atualizar transação também
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

async function handlePaymentDeleted(payment: AsaasPaymentData) {
  logger.info('[WEBHOOK ASAAS] Pagamento deletado:', payment.id)

  // Buscar assinante
  const assinante = await prisma.assinante.findFirst({
    where: {
      OR: [
        { asaasPaymentId: payment.id },
        { asaasCustomerId: payment.customer }
      ]
    }
  })

  // Se estava pendente e foi deletado, cancelar
  if (assinante && assinante.subscriptionStatus === 'PENDING') {
    await prisma.assinante.update({
      where: { id: assinante.id },
      data: {
        subscriptionStatus: 'CANCELED',
        updatedAt: new Date()
      }
    })
    logger.info('[WEBHOOK ASAAS] Assinante pendente cancelado:', assinante.id)
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

async function sendWelcomeNotifications(
  customer: { name: string; email: string; phone?: string; mobilePhone?: string }, 
  plan: { name: string }, 
  tempPassword: string,
  isNewUser: boolean = false
) {
  try {
    // 1. Enviar Email de boas-vindas
    if (isNewUser && customer.email) {
      try {
        const emailService = getEmailService()
        if (emailService) {
          await emailService.sendEmail({
            to: customer.email,
            subject: '🎉 Bem-vindo ao UNICA Benefícios!',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                  .highlight { background: #7c3aed; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; }
                  .credentials { background: #fff; padding: 20px; border-radius: 10px; margin: 20px 0; border: 2px solid #7c3aed; }
                  .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                  .btn { display: inline-block; background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin-top: 15px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎉 Bem-vindo ao UNICA!</h1>
                  </div>
                  <div class="content">
                    <p>Olá, <strong>${customer.name}</strong>!</p>
                    <p>Sua assinatura do plano <span class="highlight">${plan.name}</span> foi ativada com sucesso!</p>
                    
                    <div class="credentials">
                      <h3>📧 Seus dados de acesso:</h3>
                      <p><strong>Email:</strong> ${customer.email}</p>
                      <p><strong>Senha temporária:</strong> ${tempPassword}</p>
                      <p style="color: #dc2626; font-size: 12px;">⚠️ Recomendamos trocar sua senha no primeiro acesso.</p>
                    </div>
                    
                    <p>Agora você pode aproveitar descontos exclusivos em nossos parceiros!</p>
                    
                    <center>
                      <a href="https://app.unicabeneficios.com.br/login" class="btn">Acessar minha conta</a>
                    </center>
                    
                    <br>
                    <p>Obrigado por fazer parte do UNICA! 💜</p>
                    <p>Abraços,<br><strong>Equipe UNICA</strong></p>
                  </div>
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} UNICA Clube de Benefícios - Grupo Zan Norte</p>
                  </div>
                </div>
              </body>
              </html>
            `
          })
          logger.info('[WEBHOOK ASAAS] Email de boas-vindas enviado')
        } else {
          logger.warn('[WEBHOOK ASAAS] EmailService não configurado (RESEND_API_KEY ausente)')
        }
      } catch (emailError) {
        logger.error('[WEBHOOK ASAAS] Erro ao enviar email de boas-vindas:', emailError)
      }
    }

    // 2. Enviar WhatsApp de boas-vindas
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

