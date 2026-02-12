import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET - Listar categorias
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const categories = await prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { parceiros: true }
        }
      }
    })

    return NextResponse.json({ data: categories })
  } catch (error) {
    console.error('[API Categories] Erro GET:', error)
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
  }
}

// POST - Criar categoria
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug: customSlug, icon, description, banner, isActive } = body

    // Validação apenas do nome (obrigatório)
    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Gerar slug a partir do nome ou usar customizado
    const slug = customSlug || name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Verificar se slug já existe
    const existing = await prisma.category.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Categoria com esse nome já existe' }, { status: 409 })
    }

    // Pegar a maior ordem atual
    const maxOrder = await prisma.category.aggregate({
      _max: { displayOrder: true }
    })
    const nextOrder = (maxOrder._max.displayOrder || 0) + 1

    // Usar placeholder se banner não fornecido
    const finalBanner = banner || '/images/category-placeholder.svg'

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        icon: icon || 'Store',
        banner: finalBanner,
        description: description || null,
        displayOrder: nextOrder,
        isActive: isActive !== false,
      }
    })

    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error) {
    console.error('[API Categories] Erro POST:', error)
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 })
  }
}
