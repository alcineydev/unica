import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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

    // Verifica se o assinante tem plano ATIVO
    const temPlanoAtivo = assinante.planId && assinante.subscriptionStatus === 'ACTIVE'

    // ========== CATEGORIAS ==========
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        banner: true
      }
    })

    // ========== DESTAQUES (para carrossel) ==========
    const destaques = await prisma.parceiro.findMany({
      where: {
        isDestaque: true,
        isActive: true,
        user: { isActive: true }
      },
      orderBy: { destaqueOrder: 'asc' },
      select: {
        id: true,
        tradeName: true,
        companyName: true,
        bannerDestaque: true,
        logo: true
      },
      take: 10
    })

    // ========== PARCEIROS EM DESTAQUE (cards) ==========
    const parceirosDestaque = await prisma.parceiro.findMany({
      where: {
        isDestaque: true,
        isActive: true,
        user: { isActive: true }
      },
      orderBy: { destaqueOrder: 'asc' },
      select: {
        id: true,
        tradeName: true,
        companyName: true,
        logo: true,
        category: true,
        city: { select: { name: true } },
        categoryRef: { select: { name: true } },
        avaliacoes: {
          where: { publicada: true },
          select: { nota: true }
        },
        benefitAccess: {
          take: 1,
          include: {
            benefit: {
              select: { type: true, value: true }
            }
          }
        }
      },
      take: 6
    })

    // ========== NOVIDADES (últimos 30 dias) ==========
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const novidades = await prisma.parceiro.findMany({
      where: {
        isActive: true,
        user: { isActive: true },
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tradeName: true,
        companyName: true,
        logo: true,
        category: true,
        city: { select: { name: true } },
        categoryRef: { select: { name: true } },
        avaliacoes: {
          where: { publicada: true },
          select: { nota: true }
        },
        benefitAccess: {
          take: 1,
          include: {
            benefit: {
              select: { type: true, value: true }
            }
          }
        }
      },
      take: 6
    })

    // Função para processar parceiros
    type ParceiroComAvaliacoes = {
      id: string
      tradeName: string | null
      companyName: string
      logo: string | null
      category: string
      city: { name: string } | null
      categoryRef: { name: string } | null
      avaliacoes: { nota: number }[]
      benefitAccess?: Array<{ benefit: { type: string; value: Record<string, number> } }>
    }
    const processParceiro = (p: ParceiroComAvaliacoes) => {
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
        category: p.category,
        city: p.city,
        categoryRef: p.categoryRef,
        rating: Math.round(mediaAvaliacoes * 10) / 10,
        totalAvaliacoes: avaliacoes.length,
        desconto
      }
    }

    // Buscar parceiros APENAS se tiver plano ativo (para lista geral)
    type ParceiroFormatado = {
      id: string
      companyName: string
      tradeName: string | null
      logo: string | null
      category: string
      description: string | null
      city: { name: string } | null
      avaliacoes: { media: number; total: number }
      benefits: Array<{ id: string; name: string; type: string; value: number }>
    }
    let parceiros: ParceiroFormatado[] = []
    if (temPlanoAtivo && assinante.plan) {
      const benefitIdsDoPlano = assinante.plan.planBenefits.map(pb => pb.benefitId)

      if (benefitIdsDoPlano.length > 0) {
        const parceirosDb = await prisma.parceiro.findMany({
          where: {
            isActive: true,
            user: { isActive: true },
            benefitAccess: {
              some: {
                benefitId: { in: benefitIdsDoPlano }
              }
            },
            ...(assinante.cityId ? { cityId: assinante.cityId } : {}),
          },
          select: {
            id: true,
            companyName: true,
            tradeName: true,
            logo: true,
            category: true,
            description: true,
            city: { select: { name: true } },
            avaliacoes: {
              where: { publicada: true },
              select: { nota: true }
            },
            benefitAccess: {
              where: { benefitId: { in: benefitIdsDoPlano } },
              include: {
                benefit: {
                  select: { id: true, name: true, type: true, value: true }
                }
              }
            }
          },
          take: 10,
          orderBy: { companyName: 'asc' }
        })

        parceiros = parceirosDb.map(p => {
          const avaliacoes = p.avaliacoes || []
          const mediaAvaliacoes = avaliacoes.length > 0
            ? avaliacoes.reduce((sum, a) => sum + a.nota, 0) / avaliacoes.length
            : 0

          return {
            id: p.id,
            companyName: p.companyName,
            tradeName: p.tradeName,
            logo: p.logo,
            category: p.category,
            description: p.description,
            city: p.city,
            avaliacoes: {
              media: Math.round(mediaAvaliacoes * 10) / 10,
              total: avaliacoes.length
            },
            benefits: p.benefitAccess.map(ba => {
              const value = ba.benefit.value as Record<string, number>
              return {
                id: ba.benefit.id,
                name: ba.benefit.name,
                type: ba.benefit.type,
                value: value.percentage || value.monthlyPoints || 0
              }
            })
          }
        })
      }
    }

    // Buscar categorias de texto disponíveis
    let categorias: string[] = []
    if (temPlanoAtivo) {
      const categoriasDb = await prisma.parceiro.findMany({
        where: {
          isActive: true,
          user: { isActive: true }
        },
        select: { category: true },
        distinct: ['category']
      })
      categorias = categoriasDb.map(c => c.category).filter(Boolean).sort()
    }

    // Se não tem plano ativo, busca planos disponíveis
    let planosDisponiveis = null
    if (!temPlanoAtivo) {
      const planos = await prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
        include: {
          planBenefits: {
            include: {
              benefit: {
                select: { id: true, name: true, type: true },
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
        // Dados do usuário
        user: {
          name: assinante.name,
          firstName: assinante.name?.split(' ')[0] || 'Usuário',
          planName: assinante.plan?.name || null
        },
        assinante: {
          name: assinante.name,
          points: Number(assinante.points),
          cashback: Number(assinante.cashback),
          planId: assinante.planId,
          subscriptionStatus: assinante.subscriptionStatus,
          planStartDate: assinante.planStartDate?.toISOString() || null,
          planEndDate: assinante.planEndDate?.toISOString() || null,
          plan: assinante.plan ? {
            name: assinante.plan.name,
            planBenefits: assinante.plan.planBenefits,
          } : null,
        },
        // Nova home
        categories,
        destaques: destaques.map(d => ({
          id: d.id,
          nomeFantasia: d.tradeName || d.companyName,
          bannerDestaque: d.bannerDestaque,
          logo: d.logo
        })),
        parceirosDestaque: parceirosDestaque.map(processParceiro),
        novidades: novidades.map(processParceiro),
        // Dados existentes (para compatibilidade)
        parceiros,
        totalBeneficios: temPlanoAtivo ? (assinante.plan?.planBenefits.length || 0) : 0,
        categorias,
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
