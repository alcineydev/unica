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
                result = await prisma.benefit.updateMany({
                    where: { id: { in: ids } },
                    data: { isActive: true }
                })
                message = `${result.count} benefício(s) ativado(s)`
                break

            case 'deactivate':
                result = await prisma.benefit.updateMany({
                    where: { id: { in: ids } },
                    data: { isActive: false }
                })
                message = `${result.count} benefício(s) desativado(s)`
                break

            case 'delete':
                // Verificar se algum benefício está vinculado a planos ou parceiros
                const benefitsWithRelations = await prisma.benefit.findMany({
                    where: { id: { in: ids } },
                    include: {
                        _count: {
                            select: {
                                planBenefits: true,
                                benefitAccess: true
                            }
                        }
                    }
                })

                const benefitsInUse = benefitsWithRelations.filter(
                    b => b._count.planBenefits > 0 || b._count.benefitAccess > 0
                )

                if (benefitsInUse.length > 0) {
                    const names = benefitsInUse.map(b => b.name).join(', ')
                    return NextResponse.json({
                        error: `Não é possível excluir. Os benefícios "${names}" estão vinculados a planos ou parceiros.`
                    }, { status: 400 })
                }

                // Deletar benefícios
                result = await prisma.benefit.deleteMany({
                    where: { id: { in: ids } }
                })
                message = `${result.count} benefício(s) excluído(s)`
                break

            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
        }

        return NextResponse.json({ message, count: result?.count || 0 })
    } catch (error) {
        console.error('[BENEFITS BULK]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
