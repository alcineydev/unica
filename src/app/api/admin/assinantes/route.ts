import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getEmailService } from '@/services/email'

export const dynamic = 'force-dynamic'

// GET - Listar todos os assinantes
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user || !['ADMIN', 'DEVELOPER'].includes(session.user.role as string)) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status')
        const planId = searchParams.get('planId')

        const where: any = {}

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { cpf: { contains: search.replace(/\D/g, '') } },
                { user: { email: { contains: search, mode: 'insensitive' } } }
            ]
        }

        if (status) {
            where.subscriptionStatus = status
        }

        if (planId) {
            where.planId = planId
        }

        const assinantes = await prisma.assinante.findMany({
            where,
            include: {
                user: {
                    select: {
                        email: true,
                        avatar: true
                    }
                },
                plan: {
                    select: {
                        id: true,
                        name: true,
                        price: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(assinantes)
    } catch (error) {
        console.error('[ADMIN ASSINANTES GET] Erro:', error)
        return NextResponse.json({ error: 'Erro ao listar assinantes' }, { status: 500 })
    }
}

// POST - Criar novo assinante
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user || !['ADMIN', 'DEVELOPER'].includes(session.user.role as string)) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const {
            name,
            email,
            cpf,
            phone,
            password,
            planId,
            cityId,
            subscriptionStatus
        } = body

        // Validações
        if (!name?.trim()) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
        }

        if (!email?.trim()) {
            return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
        }

        if (!cpf || cpf.length !== 11) {
            return NextResponse.json({ error: 'CPF válido é obrigatório (11 dígitos)' }, { status: 400 })
        }

        if (!password || password.length < 6) {
            return NextResponse.json({ error: 'Senha é obrigatória (mínimo 6 caracteres)' }, { status: 400 })
        }

        // Verificar se email já existe
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        })

        if (existingUser) {
            return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
        }

        // Verificar se CPF já existe
        const existingCPF = await prisma.assinante.findUnique({
            where: { cpf }
        })

        if (existingCPF) {
            return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 400 })
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10)

        // Criar usuário e assinante em transação
        const result = await prisma.$transaction(async (tx) => {
            // Criar usuário
            const user = await tx.user.create({
                data: {
                    email: email.toLowerCase().trim(),
                    password: hashedPassword,
                    role: 'ASSINANTE',
                    phone: phone || null
                }
            })

            // Criar assinante
            const assinante = await tx.assinante.create({
                data: {
                    userId: user.id,
                    name: name.trim(),
                    cpf,
                    phone: phone || null,
                    subscriptionStatus: subscriptionStatus || 'PENDING',
                    planId: planId || null,
                    cityId: cityId || null,
                    points: 0,
                    cashback: 0,
                    qrCode: `UNICA-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase()
                },
                include: {
                    user: {
                        select: {
                            email: true
                        }
                    },
                    plan: true
                }
            })

            return { user, assinante }
        })

        // Enviar email de boas-vindas
        try {
            const emailService = getEmailService()
            const assinante = result.assinante as typeof result.assinante & {
                plan: { name: string } | null
                user: { email: string }
            }

            if (emailService && assinante.plan) {
                await emailService.sendWelcomeEmail(
                    assinante.user.email,
                    {
                        name: assinante.name,
                        planName: assinante.plan.name
                    }
                )
            }
        } catch (emailError) {
            console.error('[ASSINANTE POST] Erro ao enviar email:', emailError)
            // Não falha a criação se o email falhar
        }

        // Criar notificação admin
        try {
            const { notifyNewSubscriber } = await import('@/lib/admin-notifications')
            const assinante = result.assinante as typeof result.assinante & {
                plan: { name: string } | null
            }

            await notifyNewSubscriber({
                id: assinante.id,
                name: assinante.name,
                planName: assinante.plan?.name
            })
        } catch (notificationError) {
            console.error('[ASSINANTE POST] Erro ao criar notificação:', notificationError)
            // Não falha a criação se a notificação falhar
        }

        return NextResponse.json({
            success: true,
            message: 'Assinante criado com sucesso',
            assinante: result.assinante
        }, { status: 201 })

    } catch (error) {
        console.error('[ADMIN ASSINANTES POST] Erro:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Erro ao criar assinante'
        }, { status: 500 })
    }
}
