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
    password?: string
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

    // Buscar plano por ID ou slug
    console.log('[CHECKOUT] Buscando plano:', planId)
    const plan = await prisma.plan.findFirst({
      where: {
        OR: [
          { id: planId },
          { slug: planId }
        ]
      },
      include: {
        planBenefits: {
          include: { benefit: true }
        }
      }
    })

    if (!plan) {
      console.error('[CHECKOUT] Plano não encontrado:', planId)
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    if (!plan.isActive) {
      console.error('[CHECKOUT] Plano inativo:', planId)
      return NextResponse.json({ error: 'Plano não está ativo' }, { status: 400 })
    }

    console.log('[CHECKOUT] Plano encontrado:', plan.id, plan.name, 'R$', plan.price)

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
      planId: plan.id,
      customerEmail: customer.email,
      billingType,
      value: Number(plan.price),
      externalReference,
      status: 'PENDING'
    })

    // Calcular datas do ciclo
    const planStartDate = new Date()
    const planEndDate = new Date()
    if (plan.period === 'YEARLY') planEndDate.setFullYear(planEndDate.getFullYear() + 1)
    else if (plan.period === 'SINGLE') planEndDate.setFullYear(planEndDate.getFullYear() + 99)
    else planEndDate.setMonth(planEndDate.getMonth() + 1)

    // Criar assinante como PENDING (será ativado no webhook quando pagar)
    let assinanteId: string | null = null
    try {
      const bcrypt = await import('bcryptjs')
      const cpfClean = customer.cpfCnpj.replace(/\D/g, '')
      const phoneClean = customer.phone.replace(/\D/g, '')

      // Verificar se já existe usuário com este email
      let user = await prisma.user.findUnique({
        where: { email: customer.email }
      })

      if (!user) {
        // Criar usuário com a senha do checkout (ou default)
        const userPassword = customer.password || 'Unica@2025'
        const hashedPassword = await bcrypt.hash(userPassword, 12)
        
        user = await prisma.user.create({
          data: {
            email: customer.email,
            password: hashedPassword,
            role: 'ASSINANTE',
            phone: phoneClean,
            isActive: false, // Inativo até pagar
          }
        })
        console.log('[CHECKOUT] Usuário criado (inativo):', user.id)
      }

      // Verificar se já existe assinante para este usuário
      let assinante = await prisma.assinante.findUnique({
        where: { userId: user.id }
      })

      if (!assinante) {
        // Gerar QR Code único
        const qrCode = `UNICA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

        assinante = await prisma.assinante.create({
          data: {
            userId: user.id,
            name: customer.name,
            cpf: cpfClean.length === 11 ? cpfClean : null,
            phone: phoneClean,
            planId: plan.id,
            qrCode: qrCode,
            subscriptionStatus: 'PENDING',
            asaasCustomerId: asaasCustomer.id,
            asaasPaymentId: paymentResponse.id,
            asaasSubscriptionId: subscriptionResponse?.id || null,
            planStartDate,
            planEndDate,
            points: 0,
            cashback: 0,
          }
        })
        console.log('[CHECKOUT] Assinante criado (PENDING):', assinante.id)
      } else {
        // Atualizar assinante existente com novo pagamento
        assinante = await prisma.assinante.update({
          where: { id: assinante.id },
          data: {
            planId: plan.id,
            asaasCustomerId: asaasCustomer.id,
            asaasPaymentId: paymentResponse.id,
            asaasSubscriptionId: subscriptionResponse?.id || null,
            subscriptionStatus: 'PENDING',
            planStartDate,
            planEndDate,
          }
        })
        console.log('[CHECKOUT] Assinante atualizado (PENDING):', assinante.id)
      }

      assinanteId = assinante.id

      // === EMAIL DE BOAS-VINDAS COM CREDENCIAIS ===
      try {
        const { getEmailService } = await import('@/services/email')
        const emailService = getEmailService()
        if (emailService) {
          const userPassword = customer.password || 'Unica@2025'
          await emailService.sendEmail({
            to: customer.email,
            subject: `🎉 Bem-vindo ao UNICA - ${plan.name}`,
            html: `
              <!DOCTYPE html>
              <html><head><meta charset="utf-8"></head>
              <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                <div style="max-width:500px;margin:0 auto;padding:20px;">
                  <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:12px 12px 0 0;padding:24px;text-align:center;">
                    <h1 style="color:#fff;font-size:22px;margin:0;">Bem-vindo ao UNICA!</h1>
                  </div>
                  <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;">
                    <p style="color:#374151;font-size:16px;">Olá <strong>${customer.name}</strong>,</p>
                    <p style="color:#6b7280;font-size:14px;">Sua conta foi criada com sucesso! Aqui estão seus dados de acesso:</p>
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;">
                      <p style="margin:4px 0;font-size:14px;"><strong>Email:</strong> ${customer.email}</p>
                      <p style="margin:4px 0;font-size:14px;"><strong>Senha:</strong> ${userPassword}</p>
                      <p style="margin:4px 0;font-size:14px;"><strong>Plano:</strong> ${plan.name}</p>
                    </div>
                    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px;margin:16px 0;">
                      <p style="color:#92400e;font-size:12px;margin:0;">&#9203; <strong>Status:</strong> Aguardando confirmação de pagamento. Assim que confirmado, sua assinatura será ativada automaticamente.</p>
                    </div>
                    <div style="text-align:center;margin-top:20px;">
                      <a href="${process.env.NEXTAUTH_URL || 'https://app.unicabeneficios.com.br'}/login"
                         style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
                        Acessar Minha Conta
                      </a>
                    </div>
                    <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:16px;">Recomendamos trocar sua senha no primeiro acesso.</p>
                  </div>
                  <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:16px;">UNICA Clube de Benefícios</p>
                </div>
              </body>
              </html>
            `,
          })
          console.log('[CHECKOUT] Email de boas-vindas com credenciais enviado para:', customer.email)
        }
      } catch (emailError) {
        console.warn('[CHECKOUT] Email de boas-vindas não enviado:', emailError)
      }

      // === NOTIFICAÇÃO IN-APP (SININHO) PARA ADMINS ===
      try {
        const { notifyNewSubscriber } = await import('@/lib/admin-notifications')
        await notifyNewSubscriber({
          id: assinante.id,
          name: customer.name,
          planName: plan.name,
        })
      } catch (notifErr) {
        console.warn('[CHECKOUT] Notificação in-app falhou:', notifErr)
      }

      // === PUSH NOTIFICATION PARA ADMINS ===
      try {
        const { notifyNewSubscriber: pushNotify } = await import('@/lib/push-notifications')
        await pushNotify(customer.name, plan.name)
      } catch (pushErr) {
        console.warn('[CHECKOUT] Push não enviado:', pushErr)
      }
    } catch (dbError) {
      console.error('[CHECKOUT] Erro ao criar/atualizar assinante:', dbError)
      // Não falhar o checkout, apenas logar - o webhook pode criar depois
    }

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
      assinanteId,
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

