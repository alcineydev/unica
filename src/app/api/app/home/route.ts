import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ASSINANTE') {
      return NextResponse.json(
        { error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    // Busca o assinante
    const assinante = await prisma.assinante.findUnique({
      where: { userId: session.user.id! },
      include: {
        plan: {
          include: {
            planBenefits: {
              include: {
                benefit: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
        city: true,
      },
    })

    if (!assinante) {
      return NextResponse.json(
        { error: 'Assinante nao encontrado' },
        { status: 404 }
      )
    }

    // Busca parceiros (se tiver cidade, filtra por cidade)
    const parceiros = await prisma.parceiro.findMany({
      where: {
        ...(assinante.cityId ? { cityId: assinante.cityId } : {}),
        isActive: true,
        user: {
          isActive: true,
        },
      },
      select: {
        id: true,
        companyName: true,
        tradeName: true,
        category: true,
        description: true,
        city: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
    })

    // Se não tem plano, busca planos disponíveis
    let planosDisponiveis = null
    if (!assinante.planId) {
      const planos = await prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
        include: {
          planBenefits: {
            include: {
              benefit: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      })
      
      planosDisponiveis = planos.map(plan => ({
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        price: Number(plan.price),
        priceMonthly: plan.priceMonthly ? Number(plan.priceMonthly) : null,
        planBenefits: plan.planBenefits,
      }))
    }

    return NextResponse.json({
      data: {
        assinante: {
          name: assinante.name,
          points: Number(assinante.points),
          cashback: Number(assinante.cashback),
          planId: assinante.planId,
          planStartDate: assinante.planStartDate?.toISOString() || null,
          planEndDate: assinante.planEndDate?.toISOString() || null,
          plan: assinante.plan ? {
            name: assinante.plan.name,
            planBenefits: assinante.plan.planBenefits,
          } : null,
        },
        parceiros,
        totalBeneficios: assinante.plan?.planBenefits.length || 0,
        planosDisponiveis,
      },
    })
  } catch (error) {
    console.error('Erro ao carregar home:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
