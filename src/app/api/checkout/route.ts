import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

// Schema de validação do checkout
const checkoutSchema = z.object({
  planId: z.string().min(1, 'ID do plano é obrigatório'),
  planSlug: z.string().min(1, 'Slug do plano é obrigatório'),
  paymentType: z.enum(['monthly', 'yearly', 'single']),
  amount: z.number().min(0.01, 'Valor inválido'),
  customer: z.object({
    name: z.string().min(2, 'Nome é obrigatório'),
    email: z.string().email('E-mail inválido'),
    phone: z.string().min(10, 'Telefone inválido'),
    cpf: z.string().length(11, 'CPF deve ter 11 dígitos'),
  }),
})

// Função para buscar configuração do banco
async function getConfig(key: string): Promise<string | null> {
  const config = await prisma.config.findUnique({
    where: { key },
  })
  return config?.value || null
}

// Função para formatar o tipo de pagamento
function formatPaymentType(type: string): string {
  switch (type) {
    case 'monthly':
      return 'Mensal'
    case 'yearly':
      return 'Anual'
    case 'single':
      return 'Pagamento Único'
    default:
      return type
  }
}

// POST - Criar checkout com Mercado Pago
export async function POST(request: Request) {
  try {
    const body = await request.json()
    logger.log('=== CHECKOUT - Iniciando ===')
    logger.debug('Dados recebidos:', JSON.stringify(body, null, 2))

    // Validar dados
    const validationResult = checkoutSchema.safeParse(body)
    if (!validationResult.success) {
      logger.debug('Erro de validação:', validationResult.error.flatten())
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { planId, planSlug, paymentType, amount, customer } = validationResult.data

    // Verificar se o plano existe e está ativo
    const plan = await prisma.plan.findFirst({
      where: {
        id: planId,
        slug: planSlug,
        isActive: true,
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado ou indisponível' },
        { status: 404 }
      )
    }

    // Validar o valor conforme o tipo de pagamento
    let expectedAmount = 0
    switch (paymentType) {
      case 'monthly':
        expectedAmount = plan.priceMonthly ? Number(plan.priceMonthly) : Number(plan.price)
        break
      case 'yearly':
        expectedAmount = plan.priceYearly ? Number(plan.priceYearly) : Number(plan.price) * 12
        break
      case 'single':
        expectedAmount = plan.priceSingle ? Number(plan.priceSingle) : 0
        break
    }

    // Verificar se o valor está correto (com tolerância de 1 centavo)
    if (Math.abs(amount - expectedAmount) > 0.01) {
      logger.debug(`Valor inválido: recebido ${amount}, esperado ${expectedAmount}`)
      return NextResponse.json(
        { error: 'Valor do pagamento não confere com o plano' },
        { status: 400 }
      )
    }

    // Buscar credenciais do Mercado Pago
    const accessToken = await getConfig('mercadopago_access_token')
    const mode = await getConfig('mercadopago_mode') || 'sandbox'

    if (!accessToken) {
      console.error('Access Token do Mercado Pago não configurado')
      return NextResponse.json(
        { error: 'Sistema de pagamento não configurado. Entre em contato com o suporte.' },
        { status: 500 }
      )
    }

    logger.debug('Modo Mercado Pago:', mode)

    // Configurar cliente Mercado Pago
    const client = new MercadoPagoConfig({ 
      accessToken,
      options: { timeout: 5000 }
    })
    const preference = new Preference(client)

    // Determinar URL base
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    logger.debug('URL base:', baseUrl)

    // Criar referência externa com dados do pedido
    const externalReference = JSON.stringify({
      planId: plan.id,
      planSlug: plan.slug,
      email: customer.email,
      cpf: customer.cpf,
      paymentType,
      createdAt: new Date().toISOString(),
    })

    // Criar preferência de pagamento
    const preferenceData = {
      body: {
        items: [
          {
            id: plan.id,
            title: `Unica - Plano ${plan.name} (${formatPaymentType(paymentType)})`,
            description: plan.description || `Assinatura do plano ${plan.name}`,
            quantity: 1,
            unit_price: amount,
            currency_id: 'BRL',
          },
        ],
        payer: {
          name: customer.name.split(' ')[0],
          surname: customer.name.split(' ').slice(1).join(' ') || '',
          email: customer.email,
          phone: {
            area_code: customer.phone.substring(0, 2),
            number: customer.phone.substring(2),
          },
          identification: {
            type: 'CPF',
            number: customer.cpf,
          },
        },
        back_urls: {
          success: `${baseUrl}/checkout/sucesso`,
          failure: `${baseUrl}/checkout/erro`,
          pending: `${baseUrl}/checkout/pendente`,
        },
        auto_return: 'approved' as const,
        external_reference: externalReference,
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        statement_descriptor: 'UNICA CLUBE',
        expires: false,
      },
    }

    logger.log('Criando preferência no Mercado Pago...')
    const result = await preference.create(preferenceData)

    logger.log('Preferência criada:', {
      id: result.id,
      init_point: result.init_point?.substring(0, 50) + '...',
      sandbox_init_point: result.sandbox_init_point?.substring(0, 50) + '...',
    })

    // Retornar URL baseada no modo
    const paymentUrl = mode === 'sandbox'
      ? result.sandbox_init_point
      : result.init_point

    if (!paymentUrl) {
      console.error('URL de pagamento não retornada pelo Mercado Pago')
      return NextResponse.json(
        { error: 'Erro ao criar link de pagamento' },
        { status: 500 }
      )
    }

    logger.log('=== CHECKOUT - Sucesso ===')
    logger.log('URL de pagamento:', paymentUrl.substring(0, 80) + '...')

    return NextResponse.json({
      success: true,
      message: 'Checkout criado com sucesso',
      paymentUrl,
      preferenceId: result.id,
      mode,
    })
  } catch (error) {
    console.error('=== CHECKOUT - Erro ===')
    console.error('Erro:', error)
    
    // Tratamento específico de erros do Mercado Pago
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Credenciais do Mercado Pago inválidas' },
          { status: 500 }
        )
      }
      if (error.message.includes('400')) {
        return NextResponse.json(
          { error: 'Dados inválidos para o Mercado Pago' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
