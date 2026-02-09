import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Buscar página por slug
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const page = await prisma.legalPage.findUnique({
            where: { slug }
        })

        if (!page) {
            return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 })
        }

        return NextResponse.json(page)
    } catch (error) {
        console.error('[LEGAL-PAGE GET]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// PUT - Atualizar página
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (!user || !['ADMIN', 'DEVELOPER'].includes(user.role)) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const body = await request.json()
        const { title, content, isActive } = body

        if (!content || content.trim().length < 10) {
            return NextResponse.json({ error: 'Conteúdo muito curto' }, { status: 400 })
        }

        const currentPage = await prisma.legalPage.findUnique({
            where: { slug }
        })

        if (!currentPage) {
            return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 })
        }

        const contentChanged = currentPage.content !== content
        const newVersion = contentChanged ? currentPage.version + 1 : currentPage.version

        const updatedPage = await prisma.legalPage.update({
            where: { slug },
            data: {
                title: title || currentPage.title,
                content,
                isActive: isActive !== undefined ? isActive : currentPage.isActive,
                version: newVersion,
                updatedBy: session.user.id,
            }
        })

        return NextResponse.json({
            message: contentChanged ? `Atualizado! Nova versão: ${newVersion}` : 'Salvo!',
            page: updatedPage,
        })
    } catch (error) {
        console.error('[LEGAL-PAGE PUT]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
