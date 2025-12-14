import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth, hashPassword } from '@/lib/auth'
import { createPartnerSchema } from '@/lib/validations/partner'

// GET - Listar todos os parceiros
export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const cityId = searchParams.get('cityId')
    const category = searchParams.get('category')

    const partners = await prisma.parceiro.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(cityId ? { cityId } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { companyName: 'asc' },
      select: {
        id: true,
        companyName: true,
        tradeName: true,
        cnpj: true,
        category: true,
        description: true,
        logo: true,
        contact: true,
        isActive: true,
        user: {
          select: {
            email: true,
            isActive: true,
          },
        },
        city: {
          select: {
            id: true,
            name: true,
            state: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    })

    return NextResponse.json({ data: partners })
  } catch (error) {
    console.error('Erro ao listar parceiros:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo parceiro
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const validationResult = createPartnerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { 
      email, password, companyName, tradeName, cnpj, 
      category, description, cityId, whatsapp, phone, isActive,
      logo, banner, gallery, benefitIds,
      address, addressNumber, neighborhood, complement, zipCode,
      website, instagram, facebook
    } = validationResult.data

    // Verifica se email já existe
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    })
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 409 }
      )
    }

    // Verifica se CNPJ já existe
    const existingCNPJ = await prisma.parceiro.findUnique({
      where: { cnpj },
    })
    if (existingCNPJ) {
      return NextResponse.json(
        { error: 'Este CNPJ já está cadastrado' },
        { status: 409 }
      )
    }

    // Verifica se cidade existe
    const city = await prisma.city.findUnique({
      where: { id: cityId },
    })
    if (!city) {
      return NextResponse.json(
        { error: 'Cidade não encontrada' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password)

    // Cria o usuário e o parceiro
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'PARCEIRO',
        isActive,
        parceiro: {
          create: {
            companyName,
            tradeName: tradeName || null,
            cnpj,
            category,
            description: description || null,
            logo: logo || null,
            banner: banner || null,
            gallery: gallery || [],
            cityId,
            balance: 0,
            address: {
              street: address || '',
              number: addressNumber || '',
              complement: complement || '',
              neighborhood: neighborhood || '',
              zipCode: zipCode || '',
            },
            contact: {
              whatsapp,
              phone: phone || '',
              email,
              website: website || '',
              instagram: instagram || '',
              facebook: facebook || '',
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
            isActive,
          },
        },
      },
      include: {
        parceiro: {
          include: {
            city: true,
          },
        },
      },
    })

    // Se há benefícios selecionados, cria os relacionamentos
    if (benefitIds && benefitIds.length > 0 && user.parceiro) {
      await prisma.benefitAccess.createMany({
        data: benefitIds.map(benefitId => ({
          benefitId,
          parceiroId: user.parceiro!.id,
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json(
      { message: 'Parceiro criado com sucesso', data: user.parceiro },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar parceiro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

