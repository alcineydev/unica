import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// GET - Listar todos os assinantes
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if (!['DEVELOPER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const planId = searchParams.get('planId') || ''
    const cityId = searchParams.get('cityId') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search.replace(/\D/g, '') } },
        { phone: { contains: search.replace(/\D/g, '') } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (status) {
      where.subscriptionStatus = status
    }

    if (planId) {
      where.planId = planId
    }

    if (cityId) {
      where.cityId = cityId
    }

    const assinantes = await prisma.assinante.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
            isActive: true,
            createdAt: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            period: true,
          },
        },
        city: {
          select: {
            id: true,
            name: true,
            state: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: assinantes })
  } catch (error) {
    console.error('[ADMIN ASSINANTES GET] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar novo assinante (simplificado)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if (!['DEVELOPER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, cpf, phone, password, planId, cityId, status } = body

    // Validações obrigatórias
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    // Verificar email duplicado
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      )
    }

    // Verificar CPF duplicado (se informado)
    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, '')
      if (cleanCpf.length === 11) {
        const existingCpf = await prisma.assinante.findUnique({
          where: { cpf: cleanCpf },
        })
        if (existingCpf) {
          return NextResponse.json(
            { error: 'Este CPF já está cadastrado' },
            { status: 400 }
          )
        }
      }
    }

    // Hash da senha (usa padrão se não informada)
    const finalPassword = password && password.length >= 6 ? password : 'Unica@2025'
    const hashedPassword = await bcrypt.hash(finalPassword, 10)

    // Gerar QR Code único
    const qrCode = `UNICA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Criar User + Assinante em transação
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          phone: phone?.replace(/\D/g, '') || null,
          role: 'ASSINANTE',
          isActive: true,
        },
      })

      const assinante = await tx.assinante.create({
        data: {
          userId: user.id,
          name: name.trim(),
          cpf: cpf ? cpf.replace(/\D/g, '') : null,
          phone: phone?.replace(/\D/g, '') || null,
          planId: planId || null,
          cityId: cityId || null,
          subscriptionStatus: status || 'PENDING',
          qrCode,
          planStartDate: planId ? new Date() : null,
        },
        include: {
          user: { select: { id: true, email: true } },
          plan: { select: { id: true, name: true } },
        },
      })

      return assinante
    })

    // Tentar enviar email de boas-vindas (não bloqueia se falhar)
    try {
      const { getEmailService } = await import('@/services/email')
      const emailService = getEmailService()
      if (emailService) {
        await emailService.sendWelcomeEmail(
          email.toLowerCase().trim(),
          {
            name: name.trim(),
            planName: result.plan?.name || 'Unica',
          }
        )
      }
    } catch (emailError) {
      console.warn('[ASSINANTE POST] Email boas-vindas falhou:', emailError)
    }

    // Tentar notificar admins (não bloqueia se falhar)
    try {
      const { notifyNewSubscriber } = await import('@/lib/admin-notifications')
      await notifyNewSubscriber({
        id: result.id,
        name: name.trim(),
        planName: result.plan?.name,
      })
    } catch (notifError) {
      console.warn('[ASSINANTE POST] Notificação admin falhou:', notifError)
    }

    // === PUSH NOTIFICATION PARA ADMINS: Novo Assinante ===
    try {
      const { notifyNewSubscriber: pushNotifyNew } = await import('@/lib/push-notifications')
      await pushNotifyNew(name.trim(), result.plan?.name || 'Sem plano')
    } catch (pushError) {
      console.warn('[ASSINANTE POST] Push não enviado:', pushError)
    }

    return NextResponse.json(
      {
        message: 'Assinante criado com sucesso',
        data: result,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[ADMIN ASSINANTES POST] Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno ao criar assinante' },
      { status: 500 }
    )
  }
}
