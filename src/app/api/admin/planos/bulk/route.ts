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
        const { action, ids } = body

        if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
        }

        let result

        switch (action) {
            case 'activate':
                result = await prisma.plan.updateMany({
                    where: { id: { in: ids } },
                    data: { isActive: true }
                })
                return NextResponse.json({
                    message: `${result.count} plano(s) ativado(s)`,
                    count: result.count
                })

            case 'deactivate':
                result = await prisma.plan.updateMany({
                    where: { id: { in: ids } },
                    data: { isActive: false }
                })
                return NextResponse.json({
                    message: `${result.count} plano(s) desativado(s)`,
                    count: result.count
                })

            case 'delete':
                // Verificar se planos têm assinantes
                const plansWithSubscribers = await prisma.plan.findMany({
                    where: {
                        id: { in: ids },
                        assinantes: { some: {} }
                    },
                    select: { name: true }
                })

                if (plansWithSubscribers.length > 0) {
                    const names = plansWithSubscribers.map(p => p.name).join(', ')
                    return NextResponse.json({
                        error: `Não é possível excluir planos com assinantes: ${names}`
                    }, { status: 400 })
                }

                // Excluir planos
                result = await prisma.plan.deleteMany({
                    where: { id: { in: ids } }
                })

                return NextResponse.json({
                    message: `${result.count} plano(s) excluído(s)`,
                    count: result.count
                })

            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
        }

    } catch (error) {
        console.error('[PLANOS BULK]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
