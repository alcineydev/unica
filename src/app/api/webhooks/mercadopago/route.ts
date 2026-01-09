import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'
import { apiRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit'
import { notifyNewSubscriber, notifyPaymentConfirmed } from '@/lib/push-notifications'

export const runtime = 'nodejs'

// Função para buscar configuração do banco
async function getConfig(key: string): Promise<string | null> {
  const config = await prisma.config.findUnique({
    where: { key },
  })
  return config?.value || null
}

// Função para gerar senha aleatória
function generatePassword(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Função para calcular próxima data de cobrança baseado no tipo de pagamento
function calculateNextBillingDate(paymentType: string): Date {
  const now = new Date()
  
  switch (paymentType) {
    case 'monthly':
      return new Date(now.setDate(now.getDate() + 30))
    case 'yearly':
      return new Date(now.setDate(now.getDate() + 365))
    case 'single':
      // Vitalício - 27 anos (aproximadamente)
      return new Date(now.setDate(now.getDate() + 9999))
    default:
      return new Date(now.setDate(now.getDate() + 30))
  }
}

// Função para gerar QR Code baseado no CPF
function generateQRCode(cpf: string): string {
  // Formato: UNICA-CPF-TIMESTAMP
  return `UNICA-${cpf}-${Date.now()}`
}

// Função para enviar mensagem WhatsApp via Evolution API
async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  try {
    const evolutionUrl = await getConfig('evolution_api_url')
    const evolutionKey = await getConfig('evolution_api_key')

    if (!evolutionUrl || !evolutionKey) {
      logger.debug('[WEBHOOK MP] Evolution API não configurada, pulando envio de WhatsApp')
      return false
    }

    // Buscar primeira instância conectada
    const instance = await prisma.whatsAppInstance.findFirst({
      where: { status: 'connected' },
    })

    if (!instance) {
      logger.debug('[WEBHOOK MP] Nenhuma instância WhatsApp conectada')
      return false
    }

    // Formatar número
    const formattedPhone = phone.replace(/\D/g, '')
    const fullNumber = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`

    // Enviar mensagem
    const response = await fetch(`${evolutionUrl}/message/sendText/${instance.instanceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: fullNumber,
        text: message,
      }),
    })

    if (response.ok) {
      logger.log('[WEBHOOK MP] WhatsApp enviado com sucesso para:', fullNumber)
      return true
    } else {
      logger.debug('[WEBHOOK MP] Erro ao enviar WhatsApp:', await response.text())
      return false
    }
  } catch (error) {
    console.error('[WEBHOOK MP] Erro ao enviar WhatsApp:', error)
    return false
  }
}

// Função para buscar detalhes do pagamento no Mercado Pago
async function getPaymentDetails(paymentId: string, accessToken: string) {
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      console.error('[WEBHOOK MP] Erro ao buscar pagamento:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[WEBHOOK MP] Erro ao buscar detalhes do pagamento:', error)
    return null
  }
}

// POST - Receber webhook do Mercado Pago
export async function POST(request: Request) {
  // Rate limiting - 60 req/minuto por IP (permissivo para webhooks)
  const ip = getClientIP(request)
  const { success } = await apiRateLimit(`webhook-mp-${ip}`)
  if (!success) {
    logger.warn('[WEBHOOK MP] Rate limit excedido para IP:', ip)
    return rateLimitResponse()
  }

  logger.log('[WEBHOOK MP] ========================================')
  logger.log('[WEBHOOK MP] Notificação recebida:', new Date().toISOString())

  try {
    // Obter body da requisição
    const body = await request.json()
    logger.debug('[WEBHOOK MP] Body:', JSON.stringify(body, null, 2))

    // Obter query params
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || body.type
    const dataId = url.searchParams.get('data.id') || body.data?.id

    logger.debug('[WEBHOOK MP] Tipo:', type)
    logger.debug('[WEBHOOK MP] Data ID:', dataId)

    // Verificar tipo de notificação
    if (type !== 'payment' && body.action !== 'payment.created' && body.action !== 'payment.updated') {
      logger.debug('[WEBHOOK MP] Tipo de notificação ignorado:', type || body.action)
      return NextResponse.json({ received: true })
    }

    // Obter ID do pagamento
    const paymentId = dataId || body.data?.id
    if (!paymentId) {
      logger.debug('[WEBHOOK MP] ID do pagamento não encontrado')
      return NextResponse.json({ received: true })
    }

    logger.log('[WEBHOOK MP] Processando pagamento:', paymentId)

    // Buscar access token
    const accessToken = await getConfig('mercadopago_access_token')
    if (!accessToken) {
      console.error('[WEBHOOK MP] Access token não configurado')
      return NextResponse.json({ error: 'Access token não configurado' }, { status: 500 })
    }

    // Buscar detalhes do pagamento
    const payment = await getPaymentDetails(paymentId, accessToken)
    if (!payment) {
      console.error('[WEBHOOK MP] Não foi possível obter detalhes do pagamento')
      return NextResponse.json({ received: true })
    }

    logger.log('[WEBHOOK MP] Status do pagamento:', payment.status)
    logger.log('[WEBHOOK MP] Valor:', payment.transaction_amount)
    logger.log('[WEBHOOK MP] External Reference:', payment.external_reference)

    // Verificar se pagamento foi aprovado
    if (payment.status !== 'approved') {
      logger.debug('[WEBHOOK MP] Pagamento não aprovado, status:', payment.status)
      
      // Logar para debug
      await prisma.systemLog.create({
        data: {
          type: 'SYSTEM',
          action: 'WEBHOOK_MERCADOPAGO',
          message: `Webhook MP - Pagamento ${paymentId} não aprovado: ${payment.status}`,
          details: JSON.stringify({
            paymentId,
            status: payment.status,
            external_reference: payment.external_reference,
          }),
        },
      })

      return NextResponse.json({ received: true })
    }

    logger.log('[WEBHOOK MP] ✅ Pagamento APROVADO:', paymentId)

    // Extrair dados do external_reference
    let referenceData: {
      planId?: string
      planSlug?: string
      email?: string
      cpf?: string
      paymentType?: string
    } = {}

    try {
      referenceData = JSON.parse(payment.external_reference || '{}')
    } catch {
      console.error('[WEBHOOK MP] Erro ao parsear external_reference')
    }

    logger.debug('[WEBHOOK MP] Dados da referência:', referenceData)

    const { planId, email, cpf, paymentType } = referenceData

    if (!planId || !email) {
      console.error('[WEBHOOK MP] Dados obrigatórios não encontrados na referência')
      return NextResponse.json({ received: true })
    }

    // Verificar se já processamos este pagamento (idempotência)
    const existingLog = await prisma.systemLog.findFirst({
      where: {
        action: 'PAGAMENTO_PROCESSADO',
        details: {
          contains: `"paymentId":"${paymentId}"`,
        },
      },
    })

    if (existingLog) {
      logger.debug('[WEBHOOK MP] Pagamento já processado anteriormente, ignorando')
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Buscar plano
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      console.error('[WEBHOOK MP] Plano não encontrado:', planId)
      return NextResponse.json({ received: true })
    }

    logger.log('[WEBHOOK MP] Plano encontrado:', plan.name)

    // Buscar cidade padrão (primeira cidade ativa)
    let defaultCity = await prisma.city.findFirst({
      where: { isActive: true },
    })

    if (!defaultCity) {
      // Criar cidade padrão se não existir
      defaultCity = await prisma.city.create({
        data: {
          name: 'Sinop',
          state: 'MT',
          isActive: true,
        },
      })
    }

    // Dados do pagador
    const payerName = payment.payer?.first_name 
      ? `${payment.payer.first_name} ${payment.payer.last_name || ''}`.trim()
      : payment.additional_info?.payer?.first_name 
        ? `${payment.additional_info.payer.first_name} ${payment.additional_info.payer.last_name || ''}`.trim()
        : 'Assinante'
    
    const payerPhone = payment.payer?.phone?.number 
      ? `${payment.payer.phone.area_code || ''}${payment.payer.phone.number}`
      : ''

    const payerCpf = (cpf || payment.payer?.identification?.number || '').replace(/\D/g, '')

    if (!payerCpf || payerCpf.length !== 11) {
      console.error('[WEBHOOK MP] CPF inválido ou não fornecido:', payerCpf)
      return NextResponse.json({ received: true, error: 'CPF inválido' })
    }

    // Verificar se já existe usuário com este email
    let user = await prisma.user.findUnique({
      where: { email },
    })

    // Verificar se já existe assinante com este CPF
    let assinante = await prisma.assinante.findUnique({
      where: { cpf: payerCpf },
    })

    let senhaGerada = ''
    let isNewUser = false

    if (assinante) {
      // Atualizar assinante existente
      logger.log('[WEBHOOK MP] Atualizando assinante existente:', assinante.id)

      assinante = await prisma.assinante.update({
        where: { id: assinante.id },
        data: {
          planId: plan.id,
          lastPaymentDate: new Date(),
          nextBillingDate: calculateNextBillingDate(paymentType || 'monthly'),
          subscriptionStatus: 'ACTIVE',
        },
      })

      // Buscar usuário associado
      user = await prisma.user.findUnique({
        where: { id: assinante.userId },
      })

      logger.log('[WEBHOOK MP] Assinante atualizado:', assinante.id)
    } else if (user) {
      // Verificar se o usuário já tem assinante
      assinante = await prisma.assinante.findUnique({
        where: { userId: user.id },
      })

      if (assinante) {
        // Atualizar assinante
        assinante = await prisma.assinante.update({
          where: { id: assinante.id },
          data: {
            planId: plan.id,
            lastPaymentDate: new Date(),
            nextBillingDate: calculateNextBillingDate(paymentType || 'monthly'),
            subscriptionStatus: 'ACTIVE',
          },
        })
        logger.log('[WEBHOOK MP] Assinante do usuário atualizado:', assinante.id)
      } else {
        // Criar assinante para usuário existente
        logger.log('[WEBHOOK MP] Criando assinante para usuário existente')
        
        assinante = await prisma.assinante.create({
          data: {
            name: payerName,
            phone: payerPhone || '00000000000',
            cpf: payerCpf,
            planId: plan.id,
            userId: user.id,
            cityId: defaultCity.id,
            address: {
              street: '',
              number: '',
              complement: '',
              neighborhood: '',
              zipCode: '',
            },
            qrCode: generateQRCode(payerCpf),
            lastPaymentDate: new Date(),
            nextBillingDate: calculateNextBillingDate(paymentType || 'monthly'),
            subscriptionStatus: 'ACTIVE',
            points: 0,
            cashback: 0,
          },
        })

        logger.log('[WEBHOOK MP] Assinante criado:', assinante.id)
      }
    } else {
      // Criar novo usuário e assinante
      logger.log('[WEBHOOK MP] Criando novo usuário e assinante')
      isNewUser = true
      senhaGerada = generatePassword(10)
      const hashedPassword = await bcrypt.hash(senhaGerada, 10)

      // Usar transação para garantir consistência
      const result = await prisma.$transaction(async (tx) => {
        // Criar usuário
        const newUser = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            role: 'ASSINANTE',
          },
        })

        logger.log('[WEBHOOK MP] Usuário criado:', newUser.id)

        // Criar assinante
        const newAssinante = await tx.assinante.create({
          data: {
            name: payerName,
            phone: payerPhone || '00000000000',
            cpf: payerCpf,
            planId: plan.id,
            userId: newUser.id,
            cityId: defaultCity!.id,
            address: {
              street: '',
              number: '',
              complement: '',
              neighborhood: '',
              zipCode: '',
            },
            qrCode: generateQRCode(payerCpf),
            lastPaymentDate: new Date(),
            nextBillingDate: calculateNextBillingDate(paymentType || 'monthly'),
            subscriptionStatus: 'ACTIVE',
            points: 0,
            cashback: 0,
          },
        })

        logger.log('[WEBHOOK MP] Assinante criado:', newAssinante.id)

        return { user: newUser, assinante: newAssinante }
      })

      user = result.user
      assinante = result.assinante
    }

    // Registrar log de pagamento processado
    await prisma.systemLog.create({
      data: {
        type: 'SYSTEM',
        action: 'PAGAMENTO_PROCESSADO',
        message: `Pagamento processado - Plano ${plan.name} para assinante ${assinante.id}`,
        userId: user?.id,
        targetId: assinante.id,
        details: JSON.stringify({
          paymentId,
          status: 'approved',
          planId: plan.id,
          planName: plan.name,
          assinanteId: assinante.id,
          paymentType,
          amount: payment.transaction_amount,
          isNewUser,
        }),
      },
    })

    logger.log('[WEBHOOK MP] ✅ Assinante processado com sucesso:', assinante.id)

    // Enviar notificação WhatsApp
    const phoneToNotify = payerPhone || assinante.phone
    if (phoneToNotify && phoneToNotify !== '00000000000') {
      const welcomeMessage = isNewUser
        ? `🎉 *Bem-vindo ao Unica Clube de Benefícios!*\n\n` +
          `Seu pagamento foi confirmado e sua conta está ativa!\n\n` +
          `📋 *Plano:* ${plan.name}\n` +
          `💰 *Valor:* R$ ${payment.transaction_amount.toFixed(2)}\n\n` +
          `🔐 *Dados de Acesso:*\n` +
          `E-mail: ${email}\n` +
          `Senha: ${senhaGerada}\n\n` +
          `⚠️ Recomendamos que você altere sua senha após o primeiro acesso.\n\n` +
          `Acesse: https://unica-theta.vercel.app/login\n\n` +
          `Aproveite todos os benefícios! 🚀`
        : `🎉 *Pagamento Confirmado!*\n\n` +
          `Seu plano foi atualizado com sucesso!\n\n` +
          `📋 *Plano:* ${plan.name}\n` +
          `💰 *Valor:* R$ ${payment.transaction_amount.toFixed(2)}\n\n` +
          `Continue aproveitando os benefícios! 🚀`

      await sendWhatsAppMessage(phoneToNotify, welcomeMessage)
    }

    // Enviar Push Notifications para admins
    try {
      if (isNewUser) {
        // Notificar novo assinante
        await notifyNewSubscriber(payerName, plan.name)
        logger.log('[WEBHOOK MP] Push enviado: Novo assinante')
      }

      // Notificar pagamento confirmado
      await notifyPaymentConfirmed(payerName, payment.transaction_amount)
      logger.log('[WEBHOOK MP] Push enviado: Pagamento confirmado')
    } catch (pushError) {
      // Não falhar o webhook por erro de push
      console.error('[WEBHOOK MP] Erro ao enviar push notification:', pushError)
    }

    logger.log('[WEBHOOK MP] ========================================')

    return NextResponse.json({
      received: true,
      processed: true,
      assinanteId: assinante.id,
    })

  } catch (error) {
    console.error('[WEBHOOK MP] ❌ Erro ao processar webhook:', error)
    
    // Logar erro
    await prisma.systemLog.create({
      data: {
        type: 'ERROR',
        action: 'WEBHOOK_MERCADOPAGO_ERROR',
        message: `Erro no webhook MP: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        details: JSON.stringify({
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
    }).catch(console.error)

    // Retornar 200 mesmo com erro para o MP não reenviar
    return NextResponse.json({ 
      received: true, 
      error: error instanceof Error ? error.message : 'Erro interno' 
    })
  }
}

// GET - Verificação do webhook (Mercado Pago pode fazer GET para verificar)
export async function GET() {
  logger.debug('[WEBHOOK MP] GET recebido - Verificação de saúde')
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Webhook do Mercado Pago ativo',
    timestamp: new Date().toISOString(),
  })
}
