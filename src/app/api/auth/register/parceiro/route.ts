import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { registerParceiroSchema } from '@/lib/validations/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Valida os dados de entrada
    const validationResult = registerParceiroSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.flatten()
      return NextResponse.json(
        { error: 'Dados inválidos', details: errors.fieldErrors },
        { status: 400 }
      )
    }

    const { companyName, tradeName, email, phone, cnpj, password } = validationResult.data

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

    // Verifica se o CNPJ já existe
    const existingCNPJ = await prisma.parceiro.findUnique({
      where: { cnpj },
    })
    if (existingCNPJ) {
      return NextResponse.json(
        { error: 'Este CNPJ já está cadastrado' },
        { status: 409 }
      )
    }

    // Busca a primeira cidade ativa (cidade padrão)
    const defaultCity = await prisma.city.findFirst({
      where: { isActive: true },
    })

    if (!defaultCity) {
      return NextResponse.json(
        { error: 'Nenhuma cidade disponível. Entre em contato com o suporte.' },
        { status: 503 }
      )
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password)

    // Cria o usuário e o perfil de parceiro em uma transação
    // Parceiros começam inativos (pendente de aprovação)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'PARCEIRO',
        isActive: false, // Aguarda aprovação do admin
        parceiro: {
          create: {
            companyName,
            tradeName: tradeName || null,
            cnpj,
            category: 'outros', // Categoria padrão, admin pode alterar depois
            cityId: defaultCity.id,
            isActive: false, // Aguarda aprovação
            balance: 0,
            address: {
              street: '',
              number: '',
              complement: '',
              neighborhood: '',
              zipCode: '',
            },
            contact: {
              whatsapp: phone,
              phone: phone,
              email: email,
            },
            hours: [
              { day: 0, dayName: 'Domingo', open: '', close: '', isClosed: true },
              { day: 1, dayName: 'Segunda-feira', open: '08:00', close: '18:00', isClosed: false },
              { day: 2, dayName: 'Terça-feira', open: '08:00', close: '18:00', isClosed: false },
              { day: 3, dayName: 'Quarta-feira', open: '08:00', close: '18:00', isClosed: false },
              { day: 4, dayName: 'Quinta-feira', open: '08:00', close: '18:00', isClosed: false },
              { day: 5, dayName: 'Sexta-feira', open: '08:00', close: '18:00', isClosed: false },
              { day: 6, dayName: 'Sábado', open: '08:00', close: '12:00', isClosed: false },
            ],
            metrics: {
              pageViews: 0,
              whatsappClicks: 0,
              totalSales: 0,
              salesAmount: 0,
            },
          },
        },
      },
      include: {
        parceiro: true,
      },
    })

    return NextResponse.json(
      {
        message: 'Solicitação de cadastro enviada! Aguarde a aprovação.',
        user: {
          id: user.id,
          email: user.email,
          companyName: user.parceiro?.companyName,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao registrar parceiro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

