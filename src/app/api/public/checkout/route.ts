import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { asaas } from '@/lib/asaas'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { addDays, format } from 'date-fns'
import { logger } from '@/lib/logger'
import { notifyNewSubscriber } from '@/lib/notifications'

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

    const selectedBillingType = billingType || 'PIX'

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
      const result = await prisma.$transaction(async (tx) => {
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

      assinante = result.assinante
      isNewUser = true

      await logger.subscriberCreated('system', assinante.id, name)

      // Notificar admins sobre novo assinante
      await notifyNewSubscriber({
        id: assinante.id,
        name,
        email,
        planName: plan.name,
      })
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

    const dueDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')

    let paymentData = null
    let pixData = null
    let subscription = null

    if (selectedBillingType === 'CREDIT_CARD' && creditCard && creditCardHolderInfo) {
      // CARTÃO: Criar assinatura direto (Asaas permite)
      subscription = await asaas.createSubscriptionWithCreditCard(
        {
          customer: asaasCustomerId,
          billingType: 'CREDIT_CARD',
          value,
          nextDueDate: dueDate,
          cycle,
          description: `Assinatura ${plan.name} - UNICA Clube`,
          externalReference: `${assinante.id}|${planId}|${cycle}`,
        },
        creditCard,
        creditCardHolderInfo
      )

      // Atualizar assinante
      await prisma.assinante.update({
        where: { id: assinante.id },
        data: {
          asaasSubscriptionId: subscription.id,
          planId: plan.id,
          subscriptionStatus: 'ACTIVE',
          planStartDate: new Date(),
        },
      })
    } else {
      // PIX ou BOLETO: Criar cobrança AVULSA primeiro
      const payment = await asaas.createPayment({
        customer: asaasCustomerId,
        billingType: selectedBillingType,
        value,
        dueDate,
        description: `Assinatura ${plan.name} - UNICA Clube`,
        externalReference: `${assinante.id}|${planId}|${cycle}|NEW`, // NEW indica que precisa criar assinatura após pagar
      })

      paymentData = payment

      // Buscar QR Code se for Pix
      if (selectedBillingType === 'PIX') {
        try {
          // Aguardar um pouco para o Asaas gerar o QR Code
          await new Promise(resolve => setTimeout(resolve, 1000))
          pixData = await asaas.getPixQrCode(payment.id)
        } catch (pixError) {
          console.error('Erro ao buscar QR Code Pix:', pixError)
        }
      }

      // Salvar pagamento no banco
      await prisma.payment.create({
        data: {
          assinanteId: assinante.id,
          planId: plan.id,
          asaasPaymentId: payment.id,
          asaasCustomerId,
          billingType: selectedBillingType,
          value,
          status: 'PENDING',
          dueDate: new Date(dueDate),
          invoiceUrl: payment.invoiceUrl,
          bankSlipUrl: payment.bankSlipUrl,
          pixQrCode: pixData?.encodedImage,
          pixPayload: pixData?.payload,
          description: `Assinatura ${plan.name}`,
          externalReference: `${assinante.id}|${planId}|${cycle}|NEW`,
        },
      })

      // Atualizar assinante como pendente
      await prisma.assinante.update({
        where: { id: assinante.id },
        data: {
          planId: plan.id,
          subscriptionStatus: 'PENDING',
          planStartDate: new Date(),
        },
      })
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
      subscription: subscription ? {
        id: subscription.id,
        status: 'ACTIVE',
      } : null,
      payment: paymentData ? {
        id: paymentData.id,
        status: 'PENDING',
        invoiceUrl: paymentData.invoiceUrl,
        bankSlipUrl: paymentData.bankSlipUrl,
      } : null,
      pixData: pixData ? {
        encodedImage: pixData.encodedImage,
        payload: pixData.payload,
        expirationDate: pixData.expirationDate,
      } : null,
      message: selectedBillingType === 'CREDIT_CARD'
        ? 'Assinatura ativada com sucesso!'
        : isNewUser
          ? 'Conta criada! Complete o pagamento.'
          : 'Pagamento gerado!',
    })
  } catch (error) {
    console.error('Erro no checkout:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
