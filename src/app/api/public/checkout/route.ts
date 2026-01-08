import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { asaas } from '@/lib/asaas'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { addDays, format } from 'date-fns'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      // Dados do usuário
      name,
      email,
      password,
      cpf,
      phone,
      // Dados do plano
      planId,
      billingType, // PIX, BOLETO, CREDIT_CARD
      period, // MONTHLY, SEMIANNUALLY, YEARLY
      // Dados do cartão (se aplicável)
      creditCard,
      creditCardHolderInfo,
    } = body

    // Validações
    if (!name || !email || !cpf || !planId) {
      return NextResponse.json(
        { error: 'Nome, email, CPF e plano são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar plano
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    // Verificar se email já existe
    let user = await prisma.user.findUnique({
      where: { email },
      include: { assinante: true },
    })

    let assinante = user?.assinante
    let isNewUser = false

    // Se usuário não existe, criar
    if (!user) {
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: 'Senha é obrigatória para novos usuários (mínimo 6 caracteres)' },
          { status: 400 }
        )
      }

      // Verificar se CPF já existe
      const existingCpf = await prisma.assinante.findUnique({
        where: { cpf: cpf.replace(/\D/g, '') },
      })

      if (existingCpf) {
        return NextResponse.json(
          { error: 'CPF já cadastrado no sistema' },
          { status: 400 }
        )
      }

      const hashedPassword = await bcrypt.hash(password, 12)
      const qrCode = `UNICA-${nanoid(12)}`

      // Criar usuário e assinante em transação
      const result = await prisma.$transaction(async (tx: typeof prisma) => {
        const newUser = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            phone: phone?.replace(/\D/g, ''),
            role: 'ASSINANTE',
            isActive: true,
          },
        })

        const newAssinante = await tx.assinante.create({
          data: {
            userId: newUser.id,
            name,
            cpf: cpf.replace(/\D/g, ''),
            phone: phone?.replace(/\D/g, ''),
            qrCode,
            subscriptionStatus: 'PENDING',
          },
        })

        return { user: newUser, assinante: newAssinante }
      })

      user = result.user as typeof user
      assinante = result.assinante
      isNewUser = true

      await logger.subscriberCreated('system', assinante.id, name)
    }

    if (!assinante) {
      return NextResponse.json(
        { error: 'Erro ao encontrar/criar assinante' },
        { status: 500 }
      )
    }

    // Criar ou buscar cliente no Asaas
    const formattedCpf = cpf.replace(/\D/g, '')
    let asaasCustomerId = assinante.asaasCustomerId

    if (!asaasCustomerId) {
      // Verificar se já existe no Asaas
      const existingCustomers = await asaas.getCustomerByCpfCnpj(formattedCpf)

      if (existingCustomers.data.length > 0) {
        asaasCustomerId = existingCustomers.data[0].id
      } else {
        // Criar novo cliente
        const customer = await asaas.createCustomer({
          name,
          email,
          cpfCnpj: formattedCpf,
          phone: phone?.replace(/\D/g, ''),
          mobilePhone: phone?.replace(/\D/g, ''),
          externalReference: assinante.id,
        })
        asaasCustomerId = customer.id
      }

      // Salvar ID do cliente Asaas
      await prisma.assinante.update({
        where: { id: assinante.id },
        data: { asaasCustomerId },
      })
    }

    // Determinar valor e ciclo
    const cycle = asaas.getCycleFromPeriod(period || plan.period || 'MONTHLY')
    let value = Number(plan.price)

    if (cycle === 'SEMIANNUALLY' && plan.priceSingle) {
      value = Number(plan.priceSingle)
    } else if (cycle === 'YEARLY' && plan.priceYearly) {
      value = Number(plan.priceYearly)
    } else if (plan.priceMonthly) {
      value = Number(plan.priceMonthly)
    }

    const nextDueDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')

    // Criar assinatura no Asaas
    let subscription
    const selectedBillingType = billingType || 'PIX'

    if (selectedBillingType === 'CREDIT_CARD' && creditCard && creditCardHolderInfo) {
      subscription = await asaas.createSubscriptionWithCreditCard(
        {
          customer: asaasCustomerId,
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
        customer: asaasCustomerId,
        billingType: selectedBillingType === 'CREDIT_CARD' ? 'UNDEFINED' : selectedBillingType,
        value,
        nextDueDate,
        cycle,
        description: `Assinatura ${plan.name} - UNICA Clube`,
        externalReference: `${assinante.id}|${planId}`,
      })
    }

    // Atualizar assinante
    await prisma.assinante.update({
      where: { id: assinante.id },
      data: {
        asaasSubscriptionId: subscription.id,
        planId: plan.id,
        subscriptionStatus: 'PENDING',
        planStartDate: new Date(),
      },
    })

    // Para Pix/Boleto, buscar dados do primeiro pagamento
    let paymentData = null
    let pixData = null

    if (selectedBillingType !== 'CREDIT_CARD') {
      // Aguardar um pouco para o Asaas criar o primeiro pagamento
      await new Promise(resolve => setTimeout(resolve, 1000))

      try {
        const payments = await asaas.getSubscriptionPayments(subscription.id)
        if (payments.data.length > 0) {
          const firstPayment = payments.data[0]
          paymentData = await asaas.getPayment(firstPayment.id)

          if (selectedBillingType === 'PIX') {
            pixData = await asaas.getPixQrCode(firstPayment.id)
          }

          // Salvar pagamento no banco
          await prisma.payment.create({
            data: {
              assinanteId: assinante.id,
              planId: plan.id,
              asaasPaymentId: firstPayment.id,
              asaasCustomerId,
              asaasSubscriptionId: subscription.id,
              billingType: selectedBillingType,
              value,
              status: 'PENDING',
              dueDate: new Date(nextDueDate),
              invoiceUrl: paymentData.invoiceUrl,
              bankSlipUrl: paymentData.bankSlipUrl,
              pixQrCode: pixData?.encodedImage,
              pixPayload: pixData?.payload,
              description: `Assinatura ${plan.name}`,
              externalReference: `${assinante.id}|${planId}`,
            },
          })
        }
      } catch (e) {
        console.error('Erro ao buscar pagamento da assinatura:', e)
      }
    }

    await logger.system(`Checkout iniciado: ${name} - ${plan.name}`, {
      assinanteId: assinante.id,
      planId: plan.id,
      billingType: selectedBillingType,
      value,
    })

    return NextResponse.json({
      success: true,
      isNewUser,
      subscription: {
        id: subscription.id,
        status: 'PENDING',
      },
      payment: paymentData ? {
        id: paymentData.id,
        status: paymentData.status,
        invoiceUrl: paymentData.invoiceUrl,
        bankSlipUrl: paymentData.bankSlipUrl,
      } : null,
      pixData: pixData ? {
        encodedImage: pixData.encodedImage,
        payload: pixData.payload,
        expirationDate: pixData.expirationDate,
      } : null,
      message: isNewUser
        ? 'Conta criada e assinatura iniciada!'
        : 'Assinatura iniciada!',
    })
  } catch (error) {
    console.error('Erro no checkout:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
