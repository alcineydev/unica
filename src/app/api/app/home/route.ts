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

    // Verifica se o assinante tem plano ATIVO (planId + status ACTIVE)
    const temPlanoAtivo = assinante.planId && assinante.subscriptionStatus === 'ACTIVE'

    // Buscar parceiros APENAS se tiver plano ativo
    let parceiros: Array<{
      id: string
      companyName: string
      tradeName: string | null
      logo: string | null
      category: string
      description: string | null
      city: { name: string } | null
      benefits: Array<{ id: string; name: string; type: string; value: number }>
    }> = []

    if (temPlanoAtivo && assinante.plan) {
      // IDs dos benefícios do plano do assinante
      const benefitIdsDoPlano = assinante.plan.planBenefits.map(pb => pb.benefitId)

      if (benefitIdsDoPlano.length > 0) {
        // Buscar apenas parceiros que oferecem benefícios do plano do assinante
        const parceirosDb = await prisma.parceiro.findMany({
          where: {
            isActive: true,
            user: {
              isActive: true,
            },
            benefitAccess: {
              some: {
                benefitId: {
                  in: benefitIdsDoPlano
                }
              }
            },
            // Filtrar por cidade do assinante se ele tiver uma
            ...(assinante.cityId ? { cityId: assinante.cityId } : {}),
          },
          select: {
            id: true,
            companyName: true,
            tradeName: true,
            logo: true,
            category: true,
            description: true,
            city: {
              select: {
                name: true,
              },
            },
            avaliacoes: {
              where: { publicada: true },
              select: { nota: true }
            },
            benefitAccess: {
              where: {
                benefitId: {
                  in: benefitIdsDoPlano
                }
              },
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
          subscriptionStatus: assinante.subscriptionStatus,
          planStartDate: assinante.planStartDate?.toISOString() || null,
          planEndDate: assinante.planEndDate?.toISOString() || null,
          plan: assinante.plan ? {
            name: assinante.plan.name,
            planBenefits: assinante.plan.planBenefits,
          } : null,
        },
        parceiros,
        totalBeneficios: temPlanoAtivo ? (assinante.plan?.planBenefits.length || 0) : 0,
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
