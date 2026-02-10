import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getEmailService } from '@/services/email'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST - Enviar campanha
export async function POST(request: NextRequest, { params }: RouteParams) {
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

        const { id } = await params

        // Buscar campanha
        const campaign = await prisma.emailCampaign.findUnique({
            where: { id },
            include: {
                targetPlan: true,
                targetCity: true
            }
        })

        if (!campaign) {
            return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
        }

        if (campaign.status === 'SENDING') {
            return NextResponse.json({ error: 'Campanha já está sendo enviada' }, { status: 400 })
        }

        if (campaign.status === 'SENT') {
            return NextResponse.json({ error: 'Campanha já foi enviada' }, { status: 400 })
        }

        // Atualizar status para SENDING
        await prisma.emailCampaign.update({
            where: { id },
            data: { status: 'SENDING' }
        })

        // Buscar destinatários
        let emails: string[] = []

        switch (campaign.targetType) {
            case 'INDIVIDUAL':
                if (campaign.individualEmail) {
                    emails = [campaign.individualEmail]
                }
                break

            case 'ALL_ASSINANTES':
                const assinantes = await prisma.assinante.findMany({
                    include: { user: { select: { email: true } } }
                })
                emails = assinantes.map(a => a.user.email).filter(e => e && e.trim()) as string[]
                break

            case 'PLANO_ESPECIFICO':
                if (campaign.targetPlanId) {
                    const assinantesPlan = await prisma.assinante.findMany({
                        where: { planId: campaign.targetPlanId },
                        include: { user: { select: { email: true } } }
                    })
                    emails = assinantesPlan.map(a => a.user.email).filter(e => e && e.trim()) as string[]
                }
                break

            case 'CIDADE_ESPECIFICA':
                if (campaign.targetCityId) {
                    const assinantesCity = await prisma.assinante.findMany({
                        where: { cityId: campaign.targetCityId },
                        include: { user: { select: { email: true } } }
                    })
                    emails = assinantesCity.map(a => a.user.email).filter(e => e && e.trim()) as string[]
                }
                break

            case 'ALL_PARCEIROS':
                const parceiros = await prisma.parceiro.findMany({
                    include: { user: { select: { email: true } } }
                })
                emails = parceiros.map(p => p.user.email).filter(e => e && e.trim()) as string[]
                break

            case 'TODOS':
                const todosAssinantes = await prisma.assinante.findMany({
                    include: { user: { select: { email: true } } }
                })
                const todosParceiros = await prisma.parceiro.findMany({
                    include: { user: { select: { email: true } } }
                })
                const emailsAssinantes = todosAssinantes.map(a => a.user.email).filter(e => e && e.trim()) as string[]
                const emailsParceiros = todosParceiros.map(p => p.user.email).filter(e => e && e.trim()) as string[]
                emails = [...new Set([...emailsAssinantes, ...emailsParceiros])]
                break
        }

        if (emails.length === 0) {
            await prisma.emailCampaign.update({
                where: { id },
                data: { status: 'FAILED' }
            })
            return NextResponse.json({ error: 'Nenhum destinatário encontrado' }, { status: 400 })
        }

        // Enviar emails
        const emailService = getEmailService()

        if (!emailService) {
            await prisma.emailCampaign.update({
                where: { id },
                data: { status: 'FAILED' }
            })
            return NextResponse.json({ error: 'Serviço de email não configurado' }, { status: 500 })
        }

        let sentCount = 0
        let failedCount = 0

        for (const email of emails) {
            try {
                await emailService.sendEmail({
                    to: email,
                    subject: campaign.subject,
                    html: campaign.htmlContent,
                    text: campaign.textContent || undefined
                })
                sentCount++
            } catch (error) {
                console.error(`Erro ao enviar para ${email}:`, error)
                failedCount++
            }
        }

        // Atualizar campanha
        const finalStatus = failedCount === 0 ? 'SENT' :
            sentCount === 0 ? 'FAILED' : 'PARTIAL'

        await prisma.emailCampaign.update({
            where: { id },
            data: {
                status: finalStatus,
                sentCount,
                failedCount,
                sentAt: new Date()
            }
        })

        return NextResponse.json({
            message: `Campanha enviada! ${sentCount} sucesso, ${failedCount} falhas.`,
            sentCount,
            failedCount,
            status: finalStatus
        })
    } catch (error) {
        console.error('[EMAIL SEND]', error)

        // Tentar reverter status
        const { id } = await params
        await prisma.emailCampaign.update({
            where: { id },
            data: { status: 'FAILED' }
        }).catch(() => { })

        return NextResponse.json({ error: 'Erro ao enviar campanha' }, { status: 500 })
    }
}
