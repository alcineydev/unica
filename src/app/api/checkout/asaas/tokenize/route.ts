import { NextRequest, NextResponse } from 'next/server'
import { tokenizeCreditCard, findOrCreateCustomer, isValidCpfCnpj } from '@/lib/asaas'

interface TokenizeRequest {
  customer: {
    name: string
    email: string
    cpfCnpj: string
    phone: string
    postalCode: string
    addressNumber: string
  }
  creditCard: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  remoteIp?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: TokenizeRequest = await request.json()
    const { customer, creditCard, remoteIp } = body

    // Validações
    if (!customer?.name || !customer?.email || !customer?.cpfCnpj) {
      return NextResponse.json({ error: 'Dados do cliente incompletos' }, { status: 400 })
    }

    if (!isValidCpfCnpj(customer.cpfCnpj)) {
      return NextResponse.json({ error: 'CPF/CNPJ inválido' }, { status: 400 })
    }

    if (!creditCard?.holderName || !creditCard?.number || !creditCard?.expiryMonth || !creditCard?.expiryYear || !creditCard?.ccv) {
      return NextResponse.json({ error: 'Dados do cartão incompletos' }, { status: 400 })
    }

    // Validar número do cartão (básico)
    const cardNumber = creditCard.number.replace(/\D/g, '')
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      return NextResponse.json({ error: 'Número do cartão inválido' }, { status: 400 })
    }

    // Validar CVV
    const cvv = creditCard.ccv.replace(/\D/g, '')
    if (cvv.length < 3 || cvv.length > 4) {
      return NextResponse.json({ error: 'CVV inválido' }, { status: 400 })
    }

    // Criar/buscar cliente no Asaas
    const asaasCustomer = await findOrCreateCustomer({
      name: customer.name,
      email: customer.email,
      cpfCnpj: customer.cpfCnpj.replace(/\D/g, ''),
      phone: customer.phone?.replace(/\D/g, ''),
      postalCode: customer.postalCode?.replace(/\D/g, ''),
      addressNumber: customer.addressNumber
    })

    // Obter IP do cliente
    const clientIp = remoteIp || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') ||
      '127.0.0.1'

    // Tokenizar cartão
    const tokenResponse = await tokenizeCreditCard({
      customer: asaasCustomer.id,
      creditCard: {
        holderName: creditCard.holderName.toUpperCase(),
        number: cardNumber,
        expiryMonth: creditCard.expiryMonth.padStart(2, '0'),
        expiryYear: creditCard.expiryYear.length === 2 ? `20${creditCard.expiryYear}` : creditCard.expiryYear,
        ccv: cvv
      },
      creditCardHolderInfo: {
        name: customer.name,
        email: customer.email,
        cpfCnpj: customer.cpfCnpj.replace(/\D/g, ''),
        postalCode: customer.postalCode?.replace(/\D/g, '') || '00000000',
        addressNumber: customer.addressNumber || '0',
        phone: customer.phone?.replace(/\D/g, '') || ''
      },
      remoteIp: clientIp
    })

    return NextResponse.json({
      success: true,
      customerId: asaasCustomer.id,
      creditCardToken: tokenResponse.creditCardToken,
      creditCardNumber: tokenResponse.creditCardNumber, // Últimos 4 dígitos
      creditCardBrand: tokenResponse.creditCardBrand
    })

  } catch (error) {
    console.error('[TOKENIZE] Erro:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao tokenizar cartão' },
      { status: 500 }
    )
  }
}

