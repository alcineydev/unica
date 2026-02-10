import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Verificar role
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (!user || !['ADMIN', 'DEVELOPER'].includes(user.role)) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const body = await request.json()
        const { action, ids } = body

        if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: 'Ação e IDs são obrigatórios' },
                { status: 400 }
            )
        }

        let result
        let message = ''

        switch (action) {
            case 'activate':
                result = await prisma.category.updateMany({
                    where: { id: { in: ids } },
                    data: { isActive: true }
                })
                message = `${result.count} categoria(s) ativada(s)`
                break

            case 'deactivate':
                result = await prisma.category.updateMany({
                    where: { id: { in: ids } },
                    data: { isActive: false }
                })
                message = `${result.count} categoria(s) desativada(s)`
                break

            case 'delete':
                // Verificar se alguma categoria tem parceiros vinculados
                const categoriesWithRelations = await prisma.category.findMany({
                    where: { id: { in: ids } },
                    include: {
                        _count: {
                            select: {
                                parceiros: true
                            }
                        }
                    }
                })

                const categoriesInUse = categoriesWithRelations.filter(
                    c => c._count.parceiros > 0
                )

                if (categoriesInUse.length > 0) {
                    const names = categoriesInUse.map(c => c.name).join(', ')
                    const totalParceiros = categoriesInUse.reduce((sum, c) => sum + c._count.parceiros, 0)
                    return NextResponse.json({
                        error: `Não é possível excluir. As categorias "${names}" possuem ${totalParceiros} parceiro(s) vinculado(s).`
                    }, { status: 400 })
                }

                // Deletar categorias
                result = await prisma.category.deleteMany({
                    where: { id: { in: ids } }
                })
                message = `${result.count} categoria(s) excluída(s)`
                break

            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
        }

        return NextResponse.json({ message, count: result?.count || 0 })
    } catch (error) {
        console.error('[CATEGORIES BULK]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
