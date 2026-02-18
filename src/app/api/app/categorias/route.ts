import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const categorias = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
                _count: {
                    select: { parceiros: true }
                }
            }
        })

        return NextResponse.json({
            categorias: categorias.map(c => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                icon: c.icon,
                count: c._count.parceiros
            }))
        })
    } catch (error) {
        console.error('Erro ao buscar categorias:', error)
        return NextResponse.json({ categorias: [] })
    }
}
