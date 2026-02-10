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
                result = await prisma.city.updateMany({
                    where: { id: { in: ids } },
                    data: { isActive: true }
                })
                message = `${result.count} cidade(s) ativada(s)`
                break

            case 'deactivate':
                result = await prisma.city.updateMany({
                    where: { id: { in: ids } },
                    data: { isActive: false }
                })
                message = `${result.count} cidade(s) desativada(s)`
                break

            case 'delete':
                // Verificar se alguma cidade tem assinantes ou parceiros vinculados
                const citiesWithRelations = await prisma.city.findMany({
                    where: { id: { in: ids } },
                    include: {
                        _count: {
                            select: {
                                assinantes: true,
                                parceiros: true
                            }
                        }
                    }
                })

                const citiesInUse = citiesWithRelations.filter(
                    c => c._count.assinantes > 0 || c._count.parceiros > 0
                )

                if (citiesInUse.length > 0) {
                    const names = citiesInUse.map(c => c.name).join(', ')
                    const totalAssinantes = citiesInUse.reduce((sum, c) => sum + c._count.assinantes, 0)
                    const totalParceiros = citiesInUse.reduce((sum, c) => sum + c._count.parceiros, 0)
                    return NextResponse.json({
                        error: `Não é possível excluir. As cidades "${names}" possuem ${totalAssinantes} assinante(s) e ${totalParceiros} parceiro(s) vinculado(s).`
                    }, { status: 400 })
                }

                // Deletar cidades
                result = await prisma.city.deleteMany({
                    where: { id: { in: ids } }
                })
                message = `${result.count} cidade(s) excluída(s)`
                break

            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
        }

        return NextResponse.json({ message, count: result?.count || 0 })
    } catch (error) {
        console.error('[CITIES BULK]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
