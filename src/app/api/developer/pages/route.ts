import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Listar todas as páginas
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const pages = await prisma.page.findMany({
      orderBy: [
        { footerOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ pages })
  } catch (error) {
    const err = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Pages GET] Erro:', err)
    return NextResponse.json({ error: 'Erro ao buscar páginas' }, { status: 500 })
  }
}

// POST - Criar nova página
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { title, slug, content, metaTitle, metaDescription, isPublished, showInFooter, footerOrder } = body

    if (!title || !slug) {
      return NextResponse.json({ error: 'Título e slug são obrigatórios' }, { status: 400 })
    }

    // Verificar se slug já existe
    const existingPage = await prisma.page.findUnique({
      where: { slug }
    })

    if (existingPage) {
      return NextResponse.json({ error: 'Já existe uma página com este slug' }, { status: 400 })
    }

    const page = await prisma.page.create({
      data: {
        title,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        content: content || '',
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || '',
        isPublished: isPublished ?? false,
        showInFooter: showInFooter ?? false,
        footerOrder: footerOrder ?? 0
      }
    })

    return NextResponse.json(page, { status: 201 })
  } catch (error) {
    const err = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Pages POST] Erro:', err)
    return NextResponse.json({ error: 'Erro ao criar página' }, { status: 500 })
  }
}
