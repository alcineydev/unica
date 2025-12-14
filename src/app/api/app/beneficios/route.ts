import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET - Buscar benefícios e parceiros do plano do assinante
export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar assinante com seu plano e benefícios
    const assinante = await prisma.assinante.findUnique({
      where: { userId: session.user.id },
      include: {
        plan: {
          include: {
            planBenefits: {
              include: {
                benefit: {
                  include: {
                    benefitAccess: {
                      include: {
                        parceiro: {
                          select: {
                            id: true,
                            companyName: true,
                            tradeName: true,
                            logo: true,
                            banner: true,
                            category: true,
                            description: true,
                            address: true,
                            contact: true,
                            isActive: true,
                            city: {
                              select: {
                                id: true,
                                name: true,
                                state: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!assinante) {
      return NextResponse.json({ 
        error: 'Assinante não encontrado',
        benefits: [],
        parceiros: [],
      }, { status: 404 })
    }

    if (!assinante.plan) {
      return NextResponse.json({ 
        benefits: [],
        parceiros: [],
        message: 'Você não possui um plano ativo. Assine um plano para ter acesso aos benefícios.',
      })
    }

    // Extrair benefícios do plano
    const benefits = assinante.plan.planBenefits.map(pb => ({
      id: pb.benefit.id,
      name: pb.benefit.name,
      type: pb.benefit.type,
      value: pb.benefit.value,
      description: pb.benefit.description,
      category: pb.benefit.category,
    }))

    // Extrair parceiros únicos que oferecem os benefícios do plano
    const parceirosMap = new Map<string, {
      id: string
      companyName: string
      tradeName: string | null
      logo: string | null
      banner: string | null
      category: string
      description: string | null
      address: unknown
      contact: unknown
      city: { id: string; name: string; state: string } | null
      benefits: Array<{
        id: string
        name: string
        type: string
        value: unknown
      }>
    }>()

    assinante.plan.planBenefits.forEach(pb => {
      pb.benefit.benefitAccess.forEach(ba => {
        // Só incluir parceiros ativos
        if (!ba.parceiro.isActive) return

        if (!parceirosMap.has(ba.parceiro.id)) {
          parceirosMap.set(ba.parceiro.id, {
            id: ba.parceiro.id,
            companyName: ba.parceiro.companyName,
            tradeName: ba.parceiro.tradeName,
            logo: ba.parceiro.logo,
            banner: ba.parceiro.banner,
            category: ba.parceiro.category,
            description: ba.parceiro.description,
            address: ba.parceiro.address,
            contact: ba.parceiro.contact,
            city: ba.parceiro.city,
            benefits: [],
          })
        }

        // Adicionar o benefício a este parceiro
        const parceiro = parceirosMap.get(ba.parceiro.id)!
        const benefitAlreadyAdded = parceiro.benefits.some(b => b.id === pb.benefit.id)
        if (!benefitAlreadyAdded) {
          parceiro.benefits.push({
            id: pb.benefit.id,
            name: pb.benefit.name,
            type: pb.benefit.type,
            value: pb.benefit.value,
          })
        }
      })
    })

    const parceiros = Array.from(parceirosMap.values())

    return NextResponse.json({
      plan: {
        id: assinante.plan.id,
        name: assinante.plan.name,
        description: assinante.plan.description,
      },
      benefits,
      parceiros,
      totalBenefits: benefits.length,
      totalParceiros: parceiros.length,
    })

  } catch (error) {
    console.error('Erro ao buscar benefícios do assinante:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

