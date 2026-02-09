import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { slugs } = body // ["termos-e-condicoes", "politica-de-privacidade"]

        if (!slugs || !Array.isArray(slugs) || slugs.length === 0) {
            return NextResponse.json({ error: 'Slugs obrigatórios' }, { status: 400 })
        }

        const pages = await prisma.legalPage.findMany({
            where: { slug: { in: slugs }, isActive: true },
            select: { id: true, slug: true, version: true }
        })

        if (pages.length !== slugs.length) {
            return NextResponse.json({ error: 'Páginas não encontradas' }, { status: 404 })
        }

        const forwarded = request.headers.get('x-forwarded-for')
        const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'

        await Promise.all(
            pages.map(page =>
                prisma.termsConsent.upsert({
                    where: {
                        userId_legalPageId: {
                            userId: session.user.id,
                            legalPageId: page.id,
                        }
                    },
                    update: {
                        pageVersion: page.version,
                        ipAddress,
                        userAgent,
                        acceptedAt: new Date(),
                    },
                    create: {
                        userId: session.user.id,
                        legalPageId: page.id,
                        pageVersion: page.version,
                        ipAddress,
                        userAgent,
                    }
                })
            )
        )

        return NextResponse.json({ message: 'Termos aceitos!' })
    } catch (error) {
        console.error('[CONSENT]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
