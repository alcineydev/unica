import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Buscar página pública por slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const page = await prisma.page.findFirst({
      where: {
        slug: { equals: slug, mode: 'insensitive' },
        isPublished: true
      }
    })

    if (!page) {
      return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      id: page.id,
      title: page.title,
      slug: page.slug,
      content: page.content,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription
    })
  } catch (error: any) {
    console.error('[Public Pages GET] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar página' }, { status: 500 })
  }
}
