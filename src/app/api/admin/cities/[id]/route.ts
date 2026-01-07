import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { updateCitySchema } from '@/lib/validations/city'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Buscar cidade por ID
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            parceiros: true,
            assinantes: true,
          },
        },
      },
    })

    if (!city) {
      return NextResponse.json(
        { error: 'Cidade não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: city })
  } catch (error) {
    console.error('Erro ao buscar cidade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar cidade
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const validationResult = updateCitySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Verifica se a cidade existe
    const existingCity = await prisma.city.findUnique({
      where: { id },
    })

    if (!existingCity) {
      return NextResponse.json(
        { error: 'Cidade não encontrada' },
        { status: 404 }
      )
    }

    // Se está alterando o nome, verifica duplicidade
    if (validationResult.data.name && validationResult.data.name !== existingCity.name) {
      const duplicateName = await prisma.city.findUnique({
        where: { name: validationResult.data.name },
      })

      if (duplicateName) {
        return NextResponse.json(
          { error: 'Já existe uma cidade com este nome' },
          { status: 409 }
        )
      }
    }

    const city = await prisma.city.update({
      where: { id },
      data: validationResult.data,
    })

    // Registrar log
    await logger.cityUpdated(session.user.id!, id, city.name)

    return NextResponse.json(
      { message: 'Cidade atualizada com sucesso', data: city }
    )
  } catch (error) {
    console.error('Erro ao atualizar cidade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir cidade
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verifica se a cidade existe
    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            parceiros: true,
            assinantes: true,
          },
        },
      },
    })

    if (!city) {
      return NextResponse.json(
        { error: 'Cidade não encontrada' },
        { status: 404 }
      )
    }

    // Não permite excluir cidade com parceiros ou assinantes
    if (city._count.parceiros > 0 || city._count.assinantes > 0) {
      return NextResponse.json(
        { 
          error: 'Não é possível excluir esta cidade pois existem parceiros ou assinantes vinculados. Desative a cidade ao invés de excluir.' 
        },
        { status: 400 }
      )
    }

    await prisma.city.delete({
      where: { id },
    })

    // Registrar log
    await logger.cityDeleted(session.user.id!, city.name)

    return NextResponse.json(
      { message: 'Cidade excluída com sucesso' }
    )
  } catch (error) {
    console.error('Erro ao excluir cidade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

