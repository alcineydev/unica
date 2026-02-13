import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

// GET - Buscar assinante completo para edição
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if (!['DEVELOPER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id } = await params

    const assinante = await prisma.assinante.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
            phone: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        plan: true,
        city: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            parceiro: {
              select: { id: true, companyName: true, tradeName: true },
            },
          },
        },
        _count: {
          select: {
            transactions: true,
            avaliacoes: true,
          },
        },
      },
    })

    if (!assinante) {
      return NextResponse.json(
        { error: 'Assinante não encontrado' },
        { status: 404 }
      )
    }

    // Buscar dados auxiliares para edição
    const [plans, cities, stats] = await Promise.all([
      prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
        select: {
          id: true,
          name: true,
          price: true,
          period: true,
          features: true,
        },
      }),
      prisma.city.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, state: true },
      }),
      prisma.transaction.aggregate({
        where: { assinanteId: id },
        _sum: {
          amount: true,
          cashbackGenerated: true,
          pointsUsed: true,
          discountApplied: true,
        },
        _count: true,
      }),
    ])

    // Timeline de transações (últimos 6 meses)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const transactionTimeline = await prisma.transaction.groupBy({
      by: ['createdAt'],
      where: {
        assinanteId: id,
        createdAt: { gte: sixMonthsAgo },
      },
      _sum: { amount: true },
      _count: true,
    })

    // Agrupar timeline por mês
    const monthlyData: Record<
      string,
      { month: string; total: number; count: number }
    > = {}
    const monthNames = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ]

    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyData[key] = {
        month: `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
        total: 0,
        count: 0,
      }
    }

    transactionTimeline.forEach((t) => {
      const date = new Date(t.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (monthlyData[key]) {
        monthlyData[key].total += Number(t._sum.amount || 0)
        monthlyData[key].count += t._count
      }
    })

    // Transações por tipo
    const transactionsByType = await prisma.transaction.groupBy({
      by: ['type'],
      where: { assinanteId: id },
      _count: true,
      _sum: { amount: true },
    })

    return NextResponse.json({
      data: assinante,
      plans,
      cities,
      stats: {
        totalTransactions: stats._count,
        totalSpent: Number(stats._sum.amount || 0),
        totalCashback: Number(stats._sum.cashbackGenerated || 0),
        totalPointsUsed: Number(stats._sum.pointsUsed || 0),
        totalDiscounts: Number(stats._sum.discountApplied || 0),
      },
      charts: {
        timeline: Object.values(monthlyData),
        byType: transactionsByType.map((t) => ({
          type: t.type,
          count: t._count,
          total: Number(t._sum.amount || 0),
        })),
      },
    })
  } catch (error) {
    console.error('[ASSINANTE GET]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Atualizar assinante
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if (!['DEVELOPER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const assinante = await prisma.assinante.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!assinante) {
      return NextResponse.json(
        { error: 'Assinante não encontrado' },
        { status: 404 }
      )
    }

    // Separar dados do User e do Assinante
    const {
      email,
      password,
      avatar,
      isActive,
      name,
      cpf,
      phone,
      birthDate,
      planId,
      cityId,
      subscriptionStatus,
      address,
      points,
      cashback,
      planStartDate,
      planEndDate,
      nextBillingDate,
    } = body

    // Verificar email duplicado
    if (email && email.toLowerCase().trim() !== assinante.user.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      })
      if (existingEmail) {
        return NextResponse.json(
          { error: 'Este email já está em uso' },
          { status: 400 }
        )
      }
    }

    // Verificar CPF duplicado
    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, '')
      if (cleanCpf.length === 11 && cleanCpf !== assinante.cpf) {
        const existingCpf = await prisma.assinante.findUnique({
          where: { cpf: cleanCpf },
        })
        if (existingCpf) {
          return NextResponse.json(
            { error: 'Este CPF já está em uso' },
            { status: 400 }
          )
        }
      }
    }

    // Atualizar em transação
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar User
      const userData: Record<string, unknown> = {}
      if (email) userData.email = email.toLowerCase().trim()
      if (password) userData.password = await bcrypt.hash(password, 10)
      if (avatar !== undefined) userData.avatar = avatar
      if (isActive !== undefined) userData.isActive = isActive
      if (phone !== undefined) userData.phone = phone ? phone.replace(/\D/g, '') : null

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: assinante.userId },
          data: userData,
        })
      }

      // Atualizar Assinante
      const assinanteData: Record<string, unknown> = {}
      if (name !== undefined) assinanteData.name = name.trim()
      if (cpf !== undefined)
        assinanteData.cpf = cpf ? cpf.replace(/\D/g, '') : null
      if (phone !== undefined)
        assinanteData.phone = phone ? phone.replace(/\D/g, '') : null
      if (birthDate !== undefined)
        assinanteData.birthDate = birthDate ? new Date(birthDate) : null
      if (planId !== undefined) assinanteData.planId = planId || null
      if (cityId !== undefined) assinanteData.cityId = cityId || null
      if (subscriptionStatus !== undefined)
        assinanteData.subscriptionStatus = subscriptionStatus
      if (address !== undefined) assinanteData.address = address
      if (points !== undefined) assinanteData.points = Number(points)
      if (cashback !== undefined) assinanteData.cashback = Number(cashback)
      if (planStartDate !== undefined)
        assinanteData.planStartDate = planStartDate
          ? new Date(planStartDate)
          : null
      if (planEndDate !== undefined)
        assinanteData.planEndDate = planEndDate ? new Date(planEndDate) : null
      if (nextBillingDate !== undefined)
        assinanteData.nextBillingDate = nextBillingDate
          ? new Date(nextBillingDate)
          : null

      const updated = await tx.assinante.update({
        where: { id },
        data: assinanteData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              avatar: true,
              isActive: true,
              phone: true,
            },
          },
          plan: { select: { id: true, name: true, price: true } },
          city: { select: { id: true, name: true, state: true } },
        },
      })

      return updated
    })

    return NextResponse.json({ message: 'Assinante atualizado', data: result })
  } catch (error) {
    console.error('[ASSINANTE PATCH]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Excluir assinante
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    if (!['DEVELOPER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    const assinante = await prisma.assinante.findUnique({
      where: { id },
      include: { _count: { select: { transactions: true } } },
    })

    if (!assinante) {
      return NextResponse.json(
        { error: 'Assinante não encontrado' },
        { status: 404 }
      )
    }

    if (assinante._count.transactions > 0 && !force) {
      return NextResponse.json(
        {
          error: 'Assinante possui transações vinculadas',
          details: { transactions: assinante._count.transactions },
          hint: 'Use ?force=true para excluir mesmo assim',
        },
        { status: 400 }
      )
    }

    // Excluir User (cascade deleta Assinante e Transactions)
    await prisma.user.delete({ where: { id: assinante.userId } })

    return NextResponse.json({ message: 'Assinante excluído com sucesso' })
  } catch (error) {
    console.error('[ASSINANTE DELETE]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
