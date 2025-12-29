import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Buscar página por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    const page = await prisma.page.findUnique({
      where: { id }
    })

    if (!page) {
      return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 })
    }

    return NextResponse.json(page)
  } catch (error: any) {
    console.error('[Pages GET/:id] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar página' }, { status: 500 })
  }
}

// PUT - Atualizar página
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, slug, content, metaTitle, metaDescription, isPublished, showInFooter, footerOrder } = body

    // Verificar se página existe
    const existingPage = await prisma.page.findUnique({
      where: { id }
    })

    if (!existingPage) {
      return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 })
    }

    // Verificar se slug já existe em outra página
    if (slug && slug !== existingPage.slug) {
      const slugExists = await prisma.page.findFirst({
        where: {
          slug,
          id: { not: id }
        }
      })

      if (slugExists) {
        return NextResponse.json({ error: 'Já existe uma página com este slug' }, { status: 400 })
      }
    }

    const page = await prisma.page.update({
      where: { id },
      data: {
        title: title ?? existingPage.title,
        slug: slug ? slug.toLowerCase().replace(/\s+/g, '-') : existingPage.slug,
        content: content ?? existingPage.content,
        metaTitle: metaTitle ?? existingPage.metaTitle,
        metaDescription: metaDescription ?? existingPage.metaDescription,
        isPublished: isPublished ?? existingPage.isPublished,
        showInFooter: showInFooter ?? existingPage.showInFooter,
        footerOrder: footerOrder ?? existingPage.footerOrder
      }
    })

    return NextResponse.json(page)
  } catch (error: any) {
    console.error('[Pages PUT] Erro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar página' }, { status: 500 })
  }
}

// DELETE - Excluir página
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar se página existe
    const existingPage = await prisma.page.findUnique({
      where: { id }
    })

    if (!existingPage) {
      return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 })
    }

    await prisma.page.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Pages DELETE] Erro:', error)
    return NextResponse.json({ error: 'Erro ao excluir página' }, { status: 500 })
  }
}
