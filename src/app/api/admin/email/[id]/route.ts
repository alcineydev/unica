import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET - Buscar campanha por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { id } = await params

        const campaign = await prisma.emailCampaign.findUnique({
            where: { id },
            include: {
                targetPlan: { select: { id: true, name: true } },
                targetCity: { select: { id: true, name: true } },
                sentByUser: { select: { id: true, email: true } }
            }
        })

        if (!campaign) {
            return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
        }

        return NextResponse.json(campaign)
    } catch (error) {
        console.error('[EMAIL GET ID]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// PATCH - Atualizar campanha
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()

        // Verificar se campanha existe e está em DRAFT
        const existing = await prisma.emailCampaign.findUnique({
            where: { id }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
        }

        if (existing.status !== 'DRAFT') {
            return NextResponse.json({ error: 'Só é possível editar campanhas em rascunho' }, { status: 400 })
        }

        const {
            subject,
            htmlContent,
            textContent,
            targetType,
            targetPlanId,
            targetCityId,
            individualEmail
        } = body

        const campaign = await prisma.emailCampaign.update({
            where: { id },
            data: {
                subject: subject?.trim() || existing.subject,
                htmlContent: htmlContent || existing.htmlContent,
                textContent: textContent !== undefined ? textContent : existing.textContent,
                targetType: targetType || existing.targetType,
                targetPlanId: targetPlanId !== undefined ? targetPlanId : existing.targetPlanId,
                targetCityId: targetCityId !== undefined ? targetCityId : existing.targetCityId,
                individualEmail: individualEmail !== undefined ? individualEmail : existing.individualEmail,
            }
        })

        return NextResponse.json(campaign)
    } catch (error) {
        console.error('[EMAIL PATCH]', error)
        return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
    }
}

// DELETE - Excluir campanha
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { id } = await params

        const existing = await prisma.emailCampaign.findUnique({
            where: { id }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
        }

        if (existing.status === 'SENDING') {
            return NextResponse.json({ error: 'Não é possível excluir campanha em envio' }, { status: 400 })
        }

        await prisma.emailCampaign.delete({ where: { id } })

        return NextResponse.json({ message: 'Campanha excluída com sucesso' })
    } catch (error) {
        console.error('[EMAIL DELETE]', error)
        return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
    }
}
