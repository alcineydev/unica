import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
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

        const body = await request.json()
        const { action, ids, planId, status } = body

        if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
        }

        let result

        switch (action) {
            case 'activate':
                result = await prisma.assinante.updateMany({
                    where: { id: { in: ids } },
                    data: { subscriptionStatus: 'ACTIVE' }
                })
                return NextResponse.json({
                    message: `${result.count} assinante(s) ativado(s)`,
                    count: result.count
                })

            case 'deactivate':
                result = await prisma.assinante.updateMany({
                    where: { id: { in: ids } },
                    data: { subscriptionStatus: 'INACTIVE' }
                })
                return NextResponse.json({
                    message: `${result.count} assinante(s) desativado(s)`,
                    count: result.count
                })

            case 'suspend':
                result = await prisma.assinante.updateMany({
                    where: { id: { in: ids } },
                    data: { subscriptionStatus: 'SUSPENDED' }
                })
                return NextResponse.json({
                    message: `${result.count} assinante(s) suspenso(s)`,
                    count: result.count
                })

            case 'change_plan':
                if (!planId) {
                    return NextResponse.json({ error: 'Plano não informado' }, { status: 400 })
                }
                result = await prisma.assinante.updateMany({
                    where: { id: { in: ids } },
                    data: { planId }
                })
                return NextResponse.json({
                    message: `${result.count} assinante(s) atualizado(s)`,
                    count: result.count
                })

            case 'change_status':
                if (!status) {
                    return NextResponse.json({ error: 'Status não informado' }, { status: 400 })
                }
                result = await prisma.assinante.updateMany({
                    where: { id: { in: ids } },
                    data: { subscriptionStatus: status }
                })
                return NextResponse.json({
                    message: `${result.count} assinante(s) atualizado(s)`,
                    count: result.count
                })

            case 'delete':
                // Buscar assinantes e seus usuários
                const assinantes = await prisma.assinante.findMany({
                    where: { id: { in: ids } },
                    select: { id: true, userId: true }
                })

                if (assinantes.length === 0) {
                    return NextResponse.json({ error: 'Nenhum assinante encontrado' }, { status: 404 })
                }

                const userIds = assinantes.map(a => a.userId).filter(Boolean)

                // Deletar assinantes
                result = await prisma.assinante.deleteMany({
                    where: { id: { in: ids } }
                })

                // Deletar usuários relacionados
                if (userIds.length > 0) {
                    await prisma.user.deleteMany({
                        where: { id: { in: userIds as string[] } }
                    })
                }

                return NextResponse.json({
                    message: `${result.count} assinante(s) excluído(s)`,
                    count: result.count
                })

            case 'add_points':
                const { points } = body
                if (points === undefined || points === null) {
                    return NextResponse.json({ error: 'Pontos não informados' }, { status: 400 })
                }

                // Adicionar pontos a cada assinante
                const updatePromises = ids.map(id =>
                    prisma.assinante.update({
                        where: { id },
                        data: { points: { increment: Number(points) } }
                    })
                )

                await Promise.all(updatePromises)

                return NextResponse.json({
                    message: `${points} pontos adicionados a ${ids.length} assinante(s)`,
                    count: ids.length
                })

            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
        }

    } catch (error) {
        console.error('[ASSINANTES BULK]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
