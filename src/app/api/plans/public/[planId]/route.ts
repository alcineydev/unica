import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ planId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { planId } = await params
    const searchTerm = decodeURIComponent(planId).trim()

    // Busca robusta: por ID exato, slug exato ou slug case-insensitive
    let plan = await prisma.plan.findFirst({
      where: {
        OR: [
          { id: searchTerm },
          { slug: searchTerm },
          { slug: searchTerm.toLowerCase() },
          { slug: { equals: searchTerm, mode: 'insensitive' } },
          // Busca por nome normalizado (sem acento) como fallback
          { name: { equals: searchTerm, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      include: {
        planBenefits: {
          include: {
            benefit: true,
          },
        },
      },
    })

    // Fallback: busca por slug parcial (contém o termo)
    if (!plan) {
      plan = await prisma.plan.findFirst({
        where: {
          OR: [
            { slug: { contains: searchTerm.toLowerCase(), mode: 'insensitive' } },
            { name: { contains: searchTerm, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        include: {
          planBenefits: {
            include: {
              benefit: true,
            },
          },
        },
      })
    }

    if (!plan) {
      console.warn('[PLAN] Plano não encontrado:', searchTerm)
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      plan: {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        price: Number(plan.price),
        priceMonthly: plan.priceMonthly ? Number(plan.priceMonthly) : null,
        priceYearly: plan.priceYearly ? Number(plan.priceYearly) : null,
        priceSingle: plan.priceSingle ? Number(plan.priceSingle) : null,
        period: plan.period,
        features: plan.features,
        benefits: plan.planBenefits.map((pb) => ({
          id: pb.benefit.id,
          name: pb.benefit.name,
          description: pb.benefit.description,
          type: pb.benefit.type,
        })),
      },
    })
  } catch (error) {
    console.error('[PLAN] Erro ao buscar plano:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar plano' },
      { status: 500 }
    )
  }
}
