import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Listar campanhas
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const campaigns = await prisma.emailCampaign.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                targetPlan: { select: { id: true, name: true } },
                targetCity: { select: { id: true, name: true } },
                sentByUser: { select: { id: true, email: true } }
            }
        })

        return NextResponse.json(campaigns)
    } catch (error) {
        console.error('[EMAIL GET]', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// POST - Criar campanha
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
        const {
            subject,
            htmlContent,
            textContent,
            targetType,
            targetPlanId,
            targetCityId,
            individualEmail
        } = body

        if (!subject?.trim()) {
            return NextResponse.json({ error: 'Assunto é obrigatório' }, { status: 400 })
        }

        if (!htmlContent?.trim()) {
            return NextResponse.json({ error: 'Conteúdo do email é obrigatório' }, { status: 400 })
        }

        if (!targetType) {
            return NextResponse.json({ error: 'Tipo de destinatário é obrigatório' }, { status: 400 })
        }

        const campaign = await prisma.emailCampaign.create({
            data: {
                subject: subject.trim(),
                htmlContent,
                textContent: textContent || null,
                targetType,
                targetPlanId: targetPlanId || null,
                targetCityId: targetCityId || null,
                individualEmail: individualEmail || null,
                sentBy: session.user.id,
                status: 'DRAFT'
            }
        })

        return NextResponse.json(campaign, { status: 201 })
    } catch (error) {
        console.error('[EMAIL POST]', error)
        return NextResponse.json({ error: 'Erro ao criar campanha' }, { status: 500 })
    }
}
