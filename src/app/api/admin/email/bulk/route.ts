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
            return NextResponse.json({ error: 'Ação e IDs são obrigatórios' }, { status: 400 })
        }

        let result
        let message = ''

        switch (action) {
            case 'duplicate':
                // Duplicar campanhas
                const campaignsToDuplicate = await prisma.emailCampaign.findMany({
                    where: { id: { in: ids } }
                })

                let duplicateCount = 0
                for (const campaign of campaignsToDuplicate) {
                    await prisma.emailCampaign.create({
                        data: {
                            subject: `${campaign.subject} (Cópia)`,
                            htmlContent: campaign.htmlContent,
                            textContent: campaign.textContent,
                            targetType: campaign.targetType,
                            targetPlanId: campaign.targetPlanId,
                            targetCityId: campaign.targetCityId,
                            individualEmail: campaign.individualEmail,
                            sentBy: session.user.id,
                            status: 'DRAFT'
                        }
                    })
                    duplicateCount++
                }
                message = `${duplicateCount} campanha(s) duplicada(s)`
                result = { count: duplicateCount }
                break

            case 'delete':
                // Não permitir excluir se estiver enviando
                const sendingCount = await prisma.emailCampaign.count({
                    where: {
                        id: { in: ids },
                        status: 'SENDING'
                    }
                })

                if (sendingCount > 0) {
                    return NextResponse.json({
                        error: 'Não é possível excluir campanhas em envio'
                    }, { status: 400 })
                }

                result = await prisma.emailCampaign.deleteMany({
                    where: { id: { in: ids } }
                })
                message = `${result.count} campanha(s) excluída(s)`
                break

            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
        }

        return NextResponse.json({ message, count: result?.count || 0 })
    } catch (error) {
        console.error('[EMAIL BULK]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
