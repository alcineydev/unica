import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { createCitySchema } from '@/lib/validations/city'

// GET - Listar todas as cidades
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

    const cities = await prisma.city.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            parceiros: true,
            assinantes: true,
          },
        },
      },
    })

    return NextResponse.json({ data: cities })
  } catch (error) {
    console.error('Erro ao listar cidades:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova cidade
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

    const validationResult = createCitySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, state, isActive } = validationResult.data

    // Verifica se já existe cidade com mesmo nome
    const existingCity = await prisma.city.findUnique({
      where: { name },
    })

    if (existingCity) {
      return NextResponse.json(
        { error: 'Já existe uma cidade com este nome' },
        { status: 409 }
      )
    }

    const city = await prisma.city.create({
      data: {
        name,
        state,
        isActive,
      },
    })

    return NextResponse.json(
      { message: 'Cidade criada com sucesso', data: city },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar cidade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

