import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Listar todas as páginas legais
export async function GET() {
    try {
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

        const pages = await prisma.legalPage.findMany({
            orderBy: { title: 'asc' },
            select: {
                id: true,
                slug: true,
                title: true,
                isActive: true,
                version: true,
                updatedAt: true,
            }
        })

        return NextResponse.json(pages)
    } catch (error) {
        console.error('[LEGAL-PAGES GET]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
