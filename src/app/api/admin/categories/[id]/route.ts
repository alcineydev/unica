import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

// GET - Buscar categoria por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { parceiros: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ data: category })
  } catch (error) {
    console.error('[API Categories] Erro GET by ID:', error)
    return NextResponse.json({ error: 'Erro ao buscar categoria' }, { status: 500 })
  }
}

// PATCH - Atualizar categoria
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, banner, isActive } = body

    // Verificar se categoria existe
    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    // Preparar dados para atualização
    const updateData: {
      name?: string
      slug?: string
      banner?: string
      isActive?: boolean
    } = {}

    if (name !== undefined) {
      updateData.name = name
      // Atualizar slug também
      updateData.slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Verificar se novo slug já existe (se for diferente do atual)
      if (updateData.slug !== existing.slug) {
        const slugExists = await prisma.category.findUnique({
          where: { slug: updateData.slug }
        })
        if (slugExists) {
          return NextResponse.json({ error: 'Categoria com esse nome já existe' }, { status: 409 })
        }
      }
    }

    if (banner !== undefined) updateData.banner = banner
    if (isActive !== undefined) updateData.isActive = isActive

    const category = await prisma.category.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ data: category })
  } catch (error) {
    console.error('[API Categories] Erro PATCH:', error)
    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 })
  }
}

// DELETE - Excluir categoria
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar se há parceiros usando esta categoria
    const parceirosCount = await prisma.parceiro.count({
      where: { categoryId: id }
    })

    if (parceirosCount > 0) {
      return NextResponse.json({
        error: `Não é possível excluir. ${parceirosCount} parceiro(s) usam esta categoria.`
      }, { status: 400 })
    }

    await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Categoria excluída com sucesso' })
  } catch (error) {
    console.error('[API Categories] Erro DELETE:', error)
    return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 500 })
  }
}
