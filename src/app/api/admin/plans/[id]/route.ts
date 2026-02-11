import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Helper: Calcular timeline dos últimos 6 meses
function calculateTimeline(assinantes: Array<{ createdAt: Date }>) {
  const months: Record<string, number> = {}
  const now = new Date()

  // Inicializar últimos 6 meses com 0
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = date.toISOString().slice(0, 7) // YYYY-MM
    months[key] = 0
  }

  // Contar assinantes por mês de criação
  assinantes.forEach(a => {
    const key = a.createdAt.toISOString().slice(0, 7)
    if (months[key] !== undefined) {
      months[key]++
    }
  })

  // Converter para array
  return Object.entries(months).map(([month, count]) => ({
    month,
    label: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short' }),
    count
  }))
}

// Helper: Calcular stats por status
function calculateStatusDistribution(assinantes: Array<{ subscriptionStatus: string }>) {
  const distribution: Record<string, number> = {
    ACTIVE: 0,
    PENDING: 0,
    SUSPENDED: 0,
    CANCELED: 0,
    EXPIRED: 0
  }

  assinantes.forEach(a => {
    if (distribution[a.subscriptionStatus] !== undefined) {
      distribution[a.subscriptionStatus]++
    }
  })

  return Object.entries(distribution)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({ status, count }))
}

// GET - Buscar plano por ID com dados completos
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Buscar plano com benefícios vinculados
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        planBenefits: {
          include: {
            benefit: true
          }
        },
        _count: {
          select: {
            assinantes: true,
            planBenefits: true
          }
        }
      }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    // Buscar todos os benefícios ativos (para seleção)
    const allBenefits = await prisma.benefit.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    // Buscar assinantes do plano para stats
    const assinantes = await prisma.assinante.findMany({
      where: { planId: id },
      select: {
        id: true,
        subscriptionStatus: true,
        createdAt: true
      }
    })

    // Calcular estatísticas
    const assinantesAtivos = assinantes.filter(a => a.subscriptionStatus === 'ACTIVE').length
    const receitaMensal = assinantesAtivos * Number(plan.price || 0)

    // Assinantes do mês atual
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)
    const novosEsteMes = assinantes.filter(a => a.createdAt >= inicioMes).length

    const stats = {
      totalAssinantes: assinantes.length,
      assinantesAtivos,
      assinantesPendentes: assinantes.filter(a => a.subscriptionStatus === 'PENDING').length,
      assinantesSuspensos: assinantes.filter(a => a.subscriptionStatus === 'SUSPENDED').length,
      assinantesExpirados: assinantes.filter(a => a.subscriptionStatus === 'EXPIRED').length,
      receitaMensal,
      receitaAnual: receitaMensal * 12,
      novosEsteMes,
      timeline: calculateTimeline(assinantes),
      statusDistribution: calculateStatusDistribution(assinantes)
    }

    return NextResponse.json({
      ...plan,
      allBenefits,
      stats
    })
  } catch (error) {
    console.error('[PLAN GET]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Atualizar plano
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const body = await request.json()

    const existing = await prisma.plan.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    const {
      name,
      slug,
      description,
      price,
      priceYearly,
      priceSingle,
      period,
      isActive,
      features,
      benefitIds // Array de IDs de benefícios
    } = body

    // Atualizar plano
    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name: name?.trim() || existing.name,
        slug: slug?.trim() || existing.slug,
        description: description !== undefined ? description : existing.description,
        price: price !== undefined ? price : existing.price,
        priceYearly: priceYearly !== undefined ? priceYearly : existing.priceYearly,
        priceSingle: priceSingle !== undefined ? priceSingle : existing.priceSingle,
        period: period || existing.period,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        features: features !== undefined ? features : existing.features,
      }
    })

    // Atualizar benefícios vinculados (se fornecido)
    if (benefitIds !== undefined && Array.isArray(benefitIds)) {
      // Remover todos os benefícios existentes
      await prisma.planBenefit.deleteMany({
        where: { planId: id }
      })

      // Adicionar novos benefícios
      if (benefitIds.length > 0) {
        await prisma.planBenefit.createMany({
          data: benefitIds.map((benefitId: string) => ({
            planId: id,
            benefitId
          }))
        })
      }
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error('[PLAN PATCH]', error)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

// DELETE - Excluir plano
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Verificar se tem assinantes
    const assinantesCount = await prisma.assinante.count({
      where: { planId: id }
    })

    if (assinantesCount > 0) {
      return NextResponse.json({
        error: `Não é possível excluir: ${assinantesCount} assinante(s) vinculado(s)`
      }, { status: 400 })
    }

    // Remover benefícios vinculados primeiro
    await prisma.planBenefit.deleteMany({
      where: { planId: id }
    })

    // Excluir plano
    await prisma.plan.delete({ where: { id } })

    return NextResponse.json({ message: 'Plano excluído com sucesso' })
  } catch (error) {
    console.error('[PLAN DELETE]', error)
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
