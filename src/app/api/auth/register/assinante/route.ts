import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { registerAssinanteSchema } from '@/lib/validations/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Valida os dados de entrada
    const validationResult = registerAssinanteSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.flatten()
      return NextResponse.json(
        { error: 'Dados inválidos', details: errors.fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, phone, cpf, password } = validationResult.data

    // Verifica se o email já existe
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    })
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 409 }
      )
    }

    // Verifica se o CPF já existe
    const existingCPF = await prisma.assinante.findUnique({
      where: { cpf },
    })
    if (existingCPF) {
      return NextResponse.json(
        { error: 'Este CPF já está cadastrado' },
        { status: 409 }
      )
    }

    // Busca o primeiro plano ativo (plano padrão)
    const defaultPlan = await prisma.plan.findFirst({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    })

    // Busca a primeira cidade ativa (cidade padrão)
    const defaultCity = await prisma.city.findFirst({
      where: { isActive: true },
    })

    // Se não houver plano ou cidade cadastrados, retorna erro
    if (!defaultPlan) {
      return NextResponse.json(
        { error: 'Nenhum plano disponível. Entre em contato com o suporte.' },
        { status: 503 }
      )
    }

    if (!defaultCity) {
      return NextResponse.json(
        { error: 'Nenhuma cidade disponível. Entre em contato com o suporte.' },
        { status: 503 }
      )
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password)

    // Gera QR Code baseado no CPF
    const qrCode = `UNICA-${cpf}`

    // Cria o usuário e o perfil de assinante em uma transação
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ASSINANTE',
        isActive: true,
        assinante: {
          create: {
            name,
            cpf,
            phone,
            qrCode,
            cityId: defaultCity.id,
            planId: defaultPlan.id,
            subscriptionStatus: 'PENDING',
            points: 0,
            cashback: 0,
            address: {
              street: '',
              number: '',
              complement: '',
              neighborhood: '',
              zipCode: '',
            },
          },
        },
      },
      include: {
        assinante: true,
      },
    })

    return NextResponse.json(
      {
        message: 'Cadastro realizado com sucesso!',
        user: {
          id: user.id,
          email: user.email,
          name: user.assinante?.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao registrar assinante:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

