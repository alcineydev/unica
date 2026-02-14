import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'
import {
  findOrCreateCustomer,
  createPayment,
  getPixQrCode,
} from '@/lib/asaas'

// ============================
// INTERFACES (compatível com o frontend)
// ============================

interface CheckoutCustomer {
  name: string
  email: string
  cpfCnpj: string
  phone: string
  password?: string
  // Endereço (enviado dentro de customer pelo frontend)
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  city?: string
  state?: string
}

interface CheckoutRequest {
  planId: string
  customer: CheckoutCustomer
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO'
  // Cartão de crédito
  creditCardToken?: string
  creditCardHolderInfo?: {
    name: string
    email: string
    cpfCnpj: string
    phone: string
    postalCode: string
    addressNumber: string
    address?: string
    province?: string
  }
}

// ============================
// HELPERS
// ============================

function generateQRCode(): string {
  return `UNICA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

function calculateDueDate(daysAhead: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  return date.toISOString().split('T')[0]
}

// ============================
// MAIN HANDLER
// ============================

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json()
    const { planId, customer, billingType, creditCardToken, creditCardHolderInfo } = body

    // ============================
    // 1. VALIDAÇÕES
    // ============================
    if (!planId || !customer?.email || !customer?.name || !customer?.cpfCnpj) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    if (!billingType || !['PIX', 'CREDIT_CARD', 'BOLETO'].includes(billingType)) {
      return NextResponse.json({ error: 'Método de pagamento inválido' }, { status: 400 })
    }

    const cpf = customer.cpfCnpj.replace(/\D/g, '')
    const phone = customer.phone?.replace(/\D/g, '') || ''

    // ============================
    // 2. BUSCAR PLANO
    // ============================
    const plan = await prisma.plan.findFirst({
      where: {
        OR: [
          { id: planId },
          { slug: planId },
        ],
      },
      include: {
        planBenefits: { include: { benefit: true } },
      },
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Plano não encontrado ou inativo' }, { status: 404 })
    }

    // Bloquear checkout do plano Convite (atribuído apenas pelo admin)
    if (plan.slug === 'convite') {
      return NextResponse.json({ error: 'Este plano não está disponível para compra' }, { status: 403 })
    }

    const price = Number(plan.price)
    console.log('[CHECKOUT] Plano:', plan.id, plan.name, 'R$', price)

    // ============================
    // 3. CALCULAR DATAS DO CICLO
    // ============================
    const planStartDate = new Date()
    const planEndDate = new Date()
    if (plan.period === 'YEARLY') {
      planEndDate.setFullYear(planEndDate.getFullYear() + 1)
    } else if (plan.period === 'SINGLE') {
      planEndDate.setFullYear(planEndDate.getFullYear() + 99)
    } else {
      planEndDate.setMonth(planEndDate.getMonth() + 1)
    }

    // ============================
    // 4. CRIAR/BUSCAR CUSTOMER NO ASAAS
    // ============================
    const asaasCustomer = await findOrCreateCustomer({
      name: customer.name,
      email: customer.email,
      cpfCnpj: cpf,
      mobilePhone: phone,
      phone: phone,
      postalCode: customer.postalCode?.replace(/\D/g, ''),
      address: customer.address,
      addressNumber: customer.addressNumber,
      complement: customer.complement,
      province: customer.province,
      city: customer.city,
      state: customer.state,
    })
    console.log('[CHECKOUT] Asaas Customer:', asaasCustomer.id)

    // ============================
    // 5. CRIAR USER + ASSINANTE NO BANCO (ANTES do pagamento)
    //    Isso elimina a race condition com o webhook
    // ============================
    const userPassword = customer.password || 'Unica@2025'
    const hashedPassword = await hash(userPassword, 12)

    // Verificar se user já existe
    let user = await prisma.user.findUnique({ where: { email: customer.email } })
    let assinante = user
      ? await prisma.assinante.findFirst({ where: { userId: user.id } })
      : null

    // Proteção: se assinante já é ACTIVE, bloquear duplicação
    if (assinante?.subscriptionStatus === 'ACTIVE') {
      return NextResponse.json({
        error: 'Este email já possui uma assinatura ativa.',
        redirect: '/login',
      }, { status: 409 })
    }

    // Montar endereço como JSON (schema: address Json?)
    const addressJson = customer.postalCode ? {
      cep: customer.postalCode.replace(/\D/g, ''),
      logradouro: customer.address || '',
      numero: customer.addressNumber || '',
      complemento: customer.complement || '',
      bairro: customer.province || '',
      cidade: customer.city || '',
      estado: customer.state || '',
    } : undefined

    if (!user) {
      // Criar user NOVO
      user = await prisma.user.create({
        data: {
          email: customer.email,
          password: hashedPassword,
          role: 'ASSINANTE',
          phone: phone,
          isActive: true, // Permitir login imediato
        },
      })
      console.log('[CHECKOUT] User criado:', user.id)
    } else {
      // User existe - atualizar se necessário
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = {
        isActive: true, // Garantir que pode logar
      }
      if (phone) updateData.phone = phone
      // Só atualiza senha se o user forneceu uma nova no checkout
      if (customer.password) {
        updateData.password = hashedPassword
      }
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      })
      console.log('[CHECKOUT] User atualizado:', user.id)
    }

    if (!assinante) {
      // Criar assinante com qrCode obrigatório
      assinante = await prisma.assinante.create({
        data: {
          userId: user.id,
          name: customer.name,
          cpf: cpf.length === 11 ? cpf : null,
          phone: phone,
          planId: plan.id,
          qrCode: generateQRCode(),
          subscriptionStatus: 'PENDING',
          asaasCustomerId: asaasCustomer.id,
          planStartDate,
          planEndDate,
          points: 0,
          cashback: 0,
          ...(addressJson ? { address: addressJson } : {}),
        },
      })
      console.log('[CHECKOUT] Assinante criado:', assinante.id)
    } else {
      // Atualizar assinante existente (status já verificado como não-ACTIVE acima)
      assinante = await prisma.assinante.update({
        where: { id: assinante.id },
        data: {
          name: customer.name,
          cpf: cpf.length === 11 ? cpf : undefined,
          phone: phone,
          planId: plan.id,
          subscriptionStatus: 'PENDING',
          asaasCustomerId: asaasCustomer.id,
          planStartDate,
          planEndDate,
          ...(addressJson ? { address: addressJson } : {}),
        },
      })
      console.log('[CHECKOUT] Assinante atualizado:', assinante.id)
    }

    // ============================
    // 6. CRIAR COBRANÇA NO ASAAS
    // ============================
    const dueDate = calculateDueDate(billingType === 'BOLETO' ? 5 : 1)
    const description = `Assinatura ${plan.name} - UNICA Clube de Benefícios`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paymentData: any = {
      customer: asaasCustomer.id,
      billingType,
      value: price,
      dueDate,
      description,
      externalReference: assinante.id, // Referência para o webhook encontrar
    }

    // Dados do cartão de crédito
    if (billingType === 'CREDIT_CARD') {
      if (creditCardToken) {
        paymentData.creditCardToken = creditCardToken
      }
      if (creditCardHolderInfo) {
        paymentData.creditCardHolderInfo = creditCardHolderInfo
      }
      // IP remoto para antifraude
      const forwardedFor = request.headers.get('x-forwarded-for')
      if (forwardedFor) {
        paymentData.remoteIp = forwardedFor.split(',')[0].trim()
      }
    }

    const paymentResponse = await createPayment(paymentData)
    console.log('[CHECKOUT] Cobrança criada:', paymentResponse.id, '- Status:', paymentResponse.status)

    // ============================
    // 7. ATUALIZAR ASSINANTE COM PAYMENT ID REAL
    // ============================
    await prisma.assinante.update({
      where: { id: assinante.id },
      data: {
        asaasPaymentId: paymentResponse.id, // SEMPRE o payment ID real (pay_xxx)
      },
    })

    // ============================
    // 8. SE CARTÃO APROVADO INSTANTANEAMENTE → ATIVAR AGORA
    // ============================
    if (paymentResponse.status === 'CONFIRMED' || paymentResponse.status === 'RECEIVED') {
      console.log('[CHECKOUT] Pagamento aprovado instantâneo! Ativando assinante.')

      await prisma.assinante.update({
        where: { id: assinante.id },
        data: {
          subscriptionStatus: 'ACTIVE',
          planStartDate,
          planEndDate,
          lastPaymentDate: new Date(),
          nextBillingDate: planEndDate,
        },
      })

      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: true },
      })
    }

    // ============================
    // 9. EMAIL DE BOAS-VINDAS COM CREDENCIAIS
    // ============================
    try {
      const { getEmailService } = await import('@/services/email')
      const emailSvc = getEmailService()
      if (emailSvc) {
        const loginUrl = `${process.env.NEXTAUTH_URL || 'https://app.unicabeneficios.com.br'}/login`
        await emailSvc.sendEmail({
          to: customer.email,
          subject: `Bem-vindo ao UNICA - ${plan.name}`,
          html: buildWelcomeEmailHtml({
            name: customer.name,
            email: customer.email,
            password: userPassword,
            planName: plan.name,
            loginUrl,
          }),
        })
        console.log('[CHECKOUT] Email de boas-vindas enviado para:', customer.email)
      }
    } catch (emailError) {
      console.warn('[CHECKOUT] Email não enviado:', emailError)
    }

    // ============================
    // 10. NOTIFICAÇÕES ADMIN (in-app + push)
    // ============================
    try {
      const { notifyNewSubscriber } = await import('@/lib/admin-notifications')
      await notifyNewSubscriber({
        id: assinante.id,
        name: customer.name,
        planName: plan.name,
      })
    } catch (e) {
      console.warn('[CHECKOUT] Notificação admin não enviada:', e)
    }

    try {
      const pushLib = await import('@/lib/push-notifications')
      if (pushLib.notifyNewSubscriber) {
        await pushLib.notifyNewSubscriber(customer.name, plan.name)
      }
    } catch (e) {
      console.warn('[CHECKOUT] Push não enviado:', e)
    }

    // ============================
    // 11. BUSCAR DADOS PIX (se necessário)
    // ============================
    let pixData = null
    if (billingType === 'PIX' && paymentResponse.id) {
      try {
        pixData = await getPixQrCode(paymentResponse.id)
      } catch (e) {
        console.warn('[CHECKOUT] QR Code PIX não obtido:', e)
      }
    }

    // ============================
    // 12. RETORNAR RESULTADO (formato compatível com frontend)
    // ============================
    return NextResponse.json({
      success: true,
      payment: {
        id: paymentResponse.id,
        status: paymentResponse.status,
        value: paymentResponse.value,
        billingType: paymentResponse.billingType,
        dueDate: paymentResponse.dueDate,
        invoiceUrl: paymentResponse.invoiceUrl,
        bankSlipUrl: paymentResponse.bankSlipUrl,
      },
      pix: pixData ? {
        qrCode: pixData.encodedImage,
        copyPaste: pixData.payload,
        expirationDate: pixData.expirationDate,
      } : null,
      customer: {
        id: user.id,
        assinanteId: assinante.id,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao processar pagamento'
    console.error('[CHECKOUT] Erro:', message, error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ============================
// EMAIL TEMPLATE
// ============================

function buildWelcomeEmailHtml(data: {
  name: string
  email: string
  password: string
  planName: string
  loginUrl: string
}): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:500px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:12px 12px 0 0;padding:24px;text-align:center;">
      <h1 style="color:#fff;font-size:22px;margin:0;">Bem-vindo ao UNICA!</h1>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;">
      <p style="color:#374151;font-size:16px;">Ol&#225; <strong>${data.name}</strong>,</p>
      <p style="color:#6b7280;font-size:14px;">Sua conta foi criada com sucesso! Seus dados de acesso:</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:4px 0;font-size:14px;"><strong>Email:</strong> ${data.email}</p>
        <p style="margin:4px 0;font-size:14px;"><strong>Senha:</strong> ${data.password}</p>
        <p style="margin:4px 0;font-size:14px;"><strong>Plano:</strong> ${data.planName}</p>
      </div>
      <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px;margin:16px 0;">
        <p style="color:#92400e;font-size:12px;margin:0;">&#9203; <strong>Status:</strong> Aguardando confirma&#231;&#227;o de pagamento. Assim que confirmado, sua assinatura ser&#225; ativada automaticamente.</p>
      </div>
      <div style="text-align:center;margin-top:20px;">
        <a href="${data.loginUrl}"
           style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
          Acessar Minha Conta
        </a>
      </div>
      <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:12px;">Recomendamos trocar sua senha no primeiro acesso.</p>
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:16px;">UNICA Clube de Benef&#237;cios</p>
  </div>
</body></html>`
}
