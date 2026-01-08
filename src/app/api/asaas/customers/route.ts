import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { asaas } from '@/lib/asaas'
import prisma from '@/lib/prisma'

// POST - Criar ou buscar cliente no Asaas
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, cpfCnpj, phone, postalCode, address, addressNumber } = body

    if (!name || !email || !cpfCnpj) {
      return NextResponse.json(
        { error: 'Nome, email e CPF/CNPJ são obrigatórios' },
        { status: 400 }
      )
    }

    const formattedCpfCnpj = asaas.formatCpfCnpj(cpfCnpj)

    // Verificar se cliente já existe no Asaas
    const existingCustomers = await asaas.getCustomerByCpfCnpj(formattedCpfCnpj)

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0]

      // Atualizar asaasCustomerId no assinante se necessário
      const assinante = await prisma.assinante.findFirst({
        where: { userId: session.user.id },
      })

      if (assinante && !assinante.asaasCustomerId) {
        await prisma.assinante.update({
          where: { id: assinante.id },
          data: { asaasCustomerId: customer.id },
        })
      }

      return NextResponse.json({
        customer,
        isNew: false,
        message: 'Cliente já existe no Asaas'
      })
    }

    // Criar novo cliente
    const customer = await asaas.createCustomer({
      name,
      email,
      cpfCnpj: formattedCpfCnpj,
      phone: phone?.replace(/\D/g, ''),
      mobilePhone: phone?.replace(/\D/g, ''),
      postalCode: postalCode?.replace(/\D/g, ''),
      address,
      addressNumber,
      externalReference: session.user.id,
    })

    // Salvar asaasCustomerId no assinante
    const assinante = await prisma.assinante.findFirst({
      where: { userId: session.user.id },
    })

    if (assinante) {
      await prisma.assinante.update({
        where: { id: assinante.id },
        data: { asaasCustomerId: customer.id },
      })
    }

    return NextResponse.json({
      customer,
      isNew: true,
      message: 'Cliente criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar/buscar cliente Asaas:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
