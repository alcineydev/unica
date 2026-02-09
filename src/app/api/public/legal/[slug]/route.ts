import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const page = await prisma.legalPage.findUnique({
            where: { slug: params.slug },
            select: {
                id: true,
                slug: true,
                title: true,
                content: true,
                version: true,
                updatedAt: true,
                isActive: true,
            }
        })

        if (!page || !page.isActive) {
            return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 })
        }

        return NextResponse.json(page)
    } catch (error) {
        console.error('[PUBLIC LEGAL]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
