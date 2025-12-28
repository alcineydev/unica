import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { slug } = await params

    console.log('[API Categoria] Buscando slug:', slug)

    // Buscar categoria por slug ou id (case insensitive)
    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: { equals: slug, mode: 'insensitive' } },
          { id: slug }
        ],
        isActive: true
      }
    })

    console.log('[API Categoria] Categoria encontrada:', category?.name || 'Não encontrada')

    if (!category) {
      // Listar todas as categorias para debug
      const allCategories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, name: true }
      })
      console.log('[API Categoria] Categorias disponíveis:', allCategories)

      return NextResponse.json({
        error: 'Categoria não encontrada',
        slugBuscado: slug,
        categoriasDisponiveis: allCategories
      }, { status: 404 })
    }

    // Buscar assinante com seu plano
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

    const benefitIdsDoPlano = assinante?.plan?.planBenefits.map(pb => pb.benefitId) || []

    // Buscar parceiros desta categoria
    const parceiros = await prisma.parceiro.findMany({
      where: {
        categoryId: category.id,
        isActive: true,
        user: { isActive: true }
      },
      include: {
        city: { select: { id: true, name: true } },
        categoryRef: { select: { id: true, name: true } },
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
              select: { id: true, name: true, type: true, value: true }
            }
          }
        }
      },
      orderBy: [
        { isDestaque: 'desc' },
        { destaqueOrder: 'asc' },
        { tradeName: 'asc' }
      ]
    })

    // Formatar parceiros com rating e desconto
    const parceirosFormatados = parceiros.map(p => {
      const avaliacoes = p.avaliacoes || []
      const mediaAvaliacoes = avaliacoes.length > 0
        ? avaliacoes.reduce((sum, a) => sum + a.nota, 0) / avaliacoes.length
        : 0

      // Extrair desconto do primeiro benefício
      let desconto = null
      if (p.benefitAccess?.[0]?.benefit) {
        const benefit = p.benefitAccess[0].benefit
        const value = benefit.value as Record<string, number>
        if (benefit.type === 'DESCONTO' && value.percentage) {
          desconto = `${value.percentage}% OFF`
        } else if (benefit.type === 'CASHBACK' && value.percentage) {
          desconto = `${value.percentage}% Cashback`
        }
      }

      return {
        id: p.id,
        nomeFantasia: p.tradeName || p.companyName,
        logo: p.logo,
        city: p.city,
        categoryRef: p.categoryRef,
        rating: Math.round(mediaAvaliacoes * 10) / 10,
        totalAvaliacoes: avaliacoes.length,
        desconto,
        isDestaque: p.isDestaque
      }
    })

    return NextResponse.json({
      category,
      parceiros: parceirosFormatados,
      total: parceiros.length
    })
  } catch (error: any) {
    console.error('[API Categoria] Erro:', error)
    return NextResponse.json({
      error: 'Erro ao buscar categoria',
      details: error?.message || 'Erro desconhecido'
    }, { status: 500 })
  }
}
