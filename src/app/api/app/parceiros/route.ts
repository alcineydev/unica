import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar assinante com seu plano e benefícios do plano
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

    if (!assinante?.plan) {
      return NextResponse.json({ 
        data: [],
        message: 'Você não possui um plano ativo'
      })
    }

    // IDs dos benefícios do plano do assinante
    const benefitIdsDoPlano = assinante.plan.planBenefits.map(pb => pb.benefitId)

    if (benefitIdsDoPlano.length === 0) {
      return NextResponse.json({ 
        data: [],
        message: 'Seu plano não possui benefícios configurados'
      })
    }

    // Buscar apenas parceiros que oferecem benefícios do plano do assinante
    const parceiros = await prisma.parceiro.findMany({
      where: {
        isActive: true,
        user: {
          isActive: true
        },
        benefitAccess: {
          some: {
            benefitId: {
              in: benefitIdsDoPlano
            }
          }
        }
      },
      select: {
        id: true,
        companyName: true,
        tradeName: true,
        logo: true,
        banner: true,
        category: true,
        description: true,
        contact: true,
        city: {
          select: { 
            id: true,
            name: true, 
            state: true 
          }
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
      orderBy: [
        { category: 'asc' },
        { companyName: 'asc' }
      ]
    })

    // Formatar resposta
    const parceirosFormatados = parceiros.map(p => {
      const contact = p.contact as Record<string, string> || {}
      return {
        id: p.id,
        companyName: p.companyName,
        tradeName: p.tradeName,
        logo: p.logo,
        banner: p.banner,
        category: p.category,
        description: p.description,
        contact: {
          whatsapp: contact.whatsapp,
          phone: contact.phone
        },
        city: p.city,
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

    return NextResponse.json({ 
      data: parceirosFormatados,
      total: parceirosFormatados.length,
      planName: assinante.plan.name
    })

  } catch (error) {
    console.error('Erro ao buscar parceiros:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
