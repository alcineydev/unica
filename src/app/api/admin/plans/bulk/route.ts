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
                result = await prisma.plan.updateMany({
                    where: { id: { in: ids } },
                    data: { isActive: true }
                })
                message = `${result.count} plano(s) ativado(s)`
                break

            case 'deactivate':
                result = await prisma.plan.updateMany({
                    where: { id: { in: ids } },
                    data: { isActive: false }
                })
                message = `${result.count} plano(s) desativado(s)`
                break

            case 'duplicate':
                // Duplicar planos um por um
                const plansToDuplicate = await prisma.plan.findMany({
                    where: { id: { in: ids } },
                    include: {
                        planBenefits: true
                    }
                })

                let duplicatedCount = 0
                for (const plan of plansToDuplicate) {
                    // Criar cópia do plano
                    const newPlan = await prisma.plan.create({
                        data: {
                            name: `${plan.name} (Cópia)`,
                            description: plan.description,
                            price: plan.price,
                            priceYearly: plan.priceYearly,
                            priceSingle: plan.priceSingle,
                            isActive: false, // Cópia começa desativada
                            slug: `${plan.slug}-copia-${Date.now()}`,
                            features: plan.features,
                            // Copiar benefícios associados
                            planBenefits: {
                                create: plan.planBenefits.map(pb => ({
                                    benefitId: pb.benefitId
                                }))
                            }
                        }
                    })
                    if (newPlan) duplicatedCount++
                }
                message = `${duplicatedCount} plano(s) duplicado(s)`
                result = { count: duplicatedCount }
                break

            case 'delete':
                // Verificar se algum plano tem assinantes
                const plansWithSubscribers = await prisma.plan.findMany({
                    where: { id: { in: ids } },
                    include: {
                        _count: {
                            select: { assinantes: true }
                        }
                    }
                })

                const plansWithActiveSubscribers = plansWithSubscribers.filter(
                    p => p._count.assinantes > 0
                )

                if (plansWithActiveSubscribers.length > 0) {
                    const names = plansWithActiveSubscribers.map(p => p.name).join(', ')
                    const total = plansWithActiveSubscribers.reduce(
                        (sum, p) => sum + p._count.assinantes, 0
                    )
                    return NextResponse.json({
                        error: `Não é possível excluir. Os planos "${names}" possuem ${total} assinante(s) vinculado(s).`
                    }, { status: 400 })
                }

                // Deletar benefícios associados primeiro (PlanBenefit)
                await prisma.planBenefit.deleteMany({
                    where: { planId: { in: ids } }
                })

                // Deletar planos
                result = await prisma.plan.deleteMany({
                    where: { id: { in: ids } }
                })
                message = `${result.count} plano(s) excluído(s)`
                break

            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
        }

        return NextResponse.json({ message, count: result?.count || 0 })
    } catch (error) {
        console.error('[PLANS BULK]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
