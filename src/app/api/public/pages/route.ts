import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Listar páginas públicas para o footer
export async function GET() {
  try {
    const pages = await prisma.page.findMany({
      where: {
        isPublished: true,
        showInFooter: true
      },
      orderBy: { footerOrder: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true
      }
    })

    return NextResponse.json({ pages })
  } catch (error: any) {
    console.error('[Public Pages GET] Erro:', error)
    return NextResponse.json({ pages: [] })
  }
}
