import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const categoria = searchParams.get('categoria') || ''
    const destaque = searchParams.get('destaque') === 'true'
    const novidades = searchParams.get('novidades') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Buscar assinante com seu plano e benefícios
    const assinante = await prisma.assinante.findUnique({
      where: { userId: session.user.id! },
      include: {
        plan: {
          include: {
            planBenefits: {
              select: { benefitId: true }
            }
          }
        }
      }
    })

    // IDs dos benefícios do plano do assinante
    const benefitIdsDoPlano = assinante?.plan?.planBenefits.map(pb => pb.benefitId) || []

    // Construir filtro where
    const where: Prisma.ParceiroWhereInput = {
      isActive: true,
      user: { isActive: true }
    }

    // Filtro por busca (nome, descrição)
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { tradeName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Filtro por categoria
    if (categoria) {
      where.categoryId = categoria
    }

    // Filtro por destaques
    if (destaque) {
      where.isDestaque = true
    }

    // Filtro por novidades (últimos 30 dias)
    if (novidades) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      where.createdAt = { gte: thirtyDaysAgo }
    }

    // Filtrar por parceiros que oferecem benefícios do plano (se tiver plano)
    if (benefitIdsDoPlano.length > 0) {
      where.benefitAccess = {
        some: {
          benefitId: { in: benefitIdsDoPlano }
        }
      }
    }

    // Buscar total para paginação
    const total = await prisma.parceiro.count({ where })

    // Buscar parceiros
    const parceiros = await prisma.parceiro.findMany({
      where,
      select: {
        id: true,
        companyName: true,
        tradeName: true,
        logo: true,
        banner: true,
        category: true,
        categoryId: true,
        description: true,
        isDestaque: true,
        contact: true,
        createdAt: true,
        city: {
          select: {
            id: true,
            name: true,
            state: true
          }
        },
        categoryRef: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true
          }
        },
        avaliacoes: {
          where: { publicada: true },
          select: { nota: true }
        },
        benefitAccess: {
          where: benefitIdsDoPlano.length > 0
            ? { benefitId: { in: benefitIdsDoPlano } }
            : {},
          include: {
            benefit: {
              select: {
                id: true,
                name: true,
                type: true,
                value: true
              }
            }
          }
        }
      },
      orderBy: [
        { isDestaque: 'desc' },
        { tradeName: 'asc' },
        { companyName: 'asc' }
      ],
      skip,
      take: limit
    })

    // Buscar categorias para filtros
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        _count: {
          select: { parceiros: true }
        }
      }
    })

    // Formatar parceiros
    const parceirosFormatados = parceiros.map(p => {
      const contact = p.contact as Record<string, string> || {}
      const avaliacoes = p.avaliacoes || []
      const mediaAvaliacoes = avaliacoes.length > 0
        ? avaliacoes.reduce((sum, a) => sum + a.nota, 0) / avaliacoes.length
        : 0

      // Extrair desconto do primeiro benefício (safety parse)
      let desconto = null
      if (p.benefitAccess?.[0]?.benefit) {
        const benefit = p.benefitAccess[0].benefit
        let rawValue = benefit.value
        if (typeof rawValue === 'string') {
          try { rawValue = JSON.parse(rawValue) } catch { rawValue = {} }
        }
        const value = (rawValue as Record<string, number>) || {}
        const pct = value.percentage || value.value || 0
        if (benefit.type === 'DESCONTO' && pct) {
          desconto = `${pct}% OFF`
        } else if (benefit.type === 'CASHBACK' && pct) {
          desconto = `${pct}% Cashback`
        }
      }

      return {
        id: p.id,
        nomeFantasia: p.tradeName || p.companyName,
        companyName: p.companyName,
        tradeName: p.tradeName,
        logo: p.logo,
        banner: p.banner,
        category: p.category,
        categoryId: p.categoryId,
        description: p.description,
        isDestaque: p.isDestaque,
        whatsapp: contact.whatsapp,
        city: p.city,
        categoryRef: p.categoryRef,
        rating: Math.round(mediaAvaliacoes * 10) / 10,
        totalAvaliacoes: avaliacoes.length,
        desconto,
        benefits: p.benefitAccess.map(ba => {
          let rawVal = ba.benefit.value
          if (typeof rawVal === 'string') {
            try { rawVal = JSON.parse(rawVal) } catch { rawVal = {} }
          }
          const value = (rawVal as Record<string, number>) || {}
          return {
            id: ba.benefit.id,
            name: ba.benefit.name,
            type: ba.benefit.type,
            value: value.percentage || value.value || value.monthlyPoints || value.points || 0
          }
        })
      }
    })

    return NextResponse.json({
      data: parceirosFormatados,
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        count: c._count.parceiros
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Erro ao buscar parceiros:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
