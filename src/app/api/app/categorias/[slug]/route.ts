import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  let step = 'inicio'

  try {
    // STEP 1: Autenticação
    step = 'autenticacao'
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // STEP 2: Pegar slug dos params
    step = 'params'
    const { slug } = await params

    if (!slug) {
      return NextResponse.json({ error: 'Slug não fornecido' }, { status: 400 })
    }

    console.log('[API Categoria] Buscando slug:', slug)

    // STEP 3: Buscar categoria
    step = 'buscar_categoria'
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

    // STEP 4: Buscar assinante
    step = 'buscar_assinante'
    let benefitIdsDoPlano: string[] = []

    try {
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
      benefitIdsDoPlano = assinante?.plan?.planBenefits.map(pb => pb.benefitId) || []
    } catch (assinanteError) {
      console.warn('[API Categoria] Erro ao buscar assinante (ignorando):', assinanteError)
      // Continuar sem os benefícios do plano
    }

    // STEP 5: Buscar parceiros básico
    step = 'buscar_parceiros'
    const parceiros = await prisma.parceiro.findMany({
      where: {
        categoryId: category.id,
        isActive: true
      },
      include: {
        city: { select: { id: true, name: true } },
        categoryRef: { select: { id: true, name: true } },
        user: { select: { isActive: true } },
        avaliacoes: {
          where: { publicada: true },
          select: { nota: true }
        },
        benefitAccess: benefitIdsDoPlano.length > 0
          ? {
              where: { benefitId: { in: benefitIdsDoPlano } },
              include: {
                benefit: {
                  select: { id: true, name: true, type: true, value: true }
                }
              }
            }
          : false
      },
      orderBy: [
        { isDestaque: 'desc' },
        { destaqueOrder: 'asc' },
        { tradeName: 'asc' }
      ]
    })

    console.log('[API Categoria] Parceiros encontrados:', parceiros.length)

    // STEP 6: Filtrar apenas parceiros com usuário ativo
    step = 'filtrar_parceiros'
    const parceirosAtivos = parceiros.filter(p => p.user?.isActive !== false)

    // STEP 7: Formatar parceiros
    step = 'formatar_parceiros'
    const parceirosFormatados = parceirosAtivos.map(p => {
      const avaliacoes = p.avaliacoes || []
      const mediaAvaliacoes = avaliacoes.length > 0
        ? avaliacoes.reduce((sum, a) => sum + a.nota, 0) / avaliacoes.length
        : 0

      // Extrair desconto do primeiro benefício
      let desconto = null
      const benefitAccess = (p as any).benefitAccess
      if (benefitAccess?.[0]?.benefit) {
        const benefit = benefitAccess[0].benefit
        const value = benefit.value as Record<string, number>
        if (benefit.type === 'DESCONTO' && value?.percentage) {
          desconto = `${value.percentage}% OFF`
        } else if (benefit.type === 'CASHBACK' && value?.percentage) {
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
      total: parceirosFormatados.length
    })
  } catch (error: any) {
    console.error('[API Categoria] ERRO no passo:', step)
    console.error('[API Categoria] Mensagem:', error?.message)
    console.error('[API Categoria] Stack:', error?.stack)

    return NextResponse.json({
      error: 'Erro ao buscar categoria',
      step: step,
      message: error?.message || 'Erro desconhecido',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}
