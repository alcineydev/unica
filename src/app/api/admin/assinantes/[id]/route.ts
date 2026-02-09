import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Buscar assinante por ID com todos os dados
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    const assinante = await prisma.assinante.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            createdAt: true,
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
          }
        },
        city: {
          select: {
            id: true,
            name: true,
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            parceiro: {
              select: {
                id: true,
                tradeName: true,
                companyName: true,
                logo: true,
              }
            }
          }
        }
      }
    })

    if (!assinante) {
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
    }

    // Calcular estatísticas
    const stats = {
      totalTransactions: assinante.transactions?.length || 0,
      totalSpent: assinante.transactions?.reduce((sum, t) =>
        t.type === 'PURCHASE' ? sum + Number(t.amount) : sum, 0) || 0,
      totalSaved: assinante.transactions?.reduce((sum, t) =>
        sum + Number(t.discountApplied || 0), 0) || 0,
      totalCashback: assinante.transactions?.reduce((sum, t) =>
        sum + Number(t.cashbackGenerated || 0), 0) || 0,
      totalPointsUsed: assinante.transactions?.reduce((sum, t) =>
        sum + Number(t.pointsUsed || 0), 0) || 0,
    }

    return NextResponse.json({ ...assinante, stats })
  } catch (error) {
    console.error('[ASSINANTE GET]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Atualizar assinante
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const {
      name,
      cpf,
      phone,
      birthDate,
      planId,
      cityId,
      subscriptionStatus,
      points,
      cashback,
      address,
      number,
      complement,
      neighborhood,
      zipCode,
    } = body

    // Atualizar assinante
    const assinante = await prisma.assinante.update({
      where: { id },
      data: {
        name: name?.trim(),
        cpf: cpf?.replace(/\D/g, ''),
        phone: phone?.replace(/\D/g, ''),
        birthDate: birthDate ? new Date(birthDate) : undefined,
        planId: planId || null,
        cityId: cityId || null,
        subscriptionStatus,
        points: points !== undefined ? Number(points) : undefined,
        cashback: cashback !== undefined ? Number(cashback) : undefined,
        address: address ? {
          address,
          number,
          complement,
          neighborhood,
          zipCode: zipCode?.replace(/\D/g, '')
        } : undefined,
      },
      include: {
        user: true,
        plan: true,
        city: true,
      }
    })

    // Se tiver nome, atualizar também no User
    if (name && assinante.userId) {
      await prisma.user.update({
        where: { id: assinante.userId },
        data: { name: name.trim() }
      })
    }

    return NextResponse.json(assinante)
  } catch (error) {
    console.error('[ASSINANTE PATCH]', error)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

// DELETE - Excluir assinante
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    const assinante = await prisma.assinante.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!assinante) {
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
    }

    // Deletar assinante (transactions serão deletadas por cascade)
    await prisma.assinante.delete({ where: { id } })

    // Deletar usuário relacionado
    if (assinante.userId) {
      await prisma.user.delete({ where: { id: assinante.userId } }).catch(() => { })
    }

    return NextResponse.json({ message: 'Assinante excluído com sucesso' })
  } catch (error) {
    console.error('[ASSINANTE DELETE]', error)
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
