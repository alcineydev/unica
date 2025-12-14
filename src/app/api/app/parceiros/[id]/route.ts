import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Await params no Next.js 15
    const { id } = await params

    // Buscar assinante e seu plano
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

    // Buscar parceiro
    const parceiro = await prisma.parceiro.findUnique({
      where: { id },
      include: {
        city: true,
        user: {
          select: { email: true }
        },
        benefitAccess: {
          where: benefitIdsDoPlano.length > 0 ? {
            benefitId: {
              in: benefitIdsDoPlano
            }
          } : undefined,
          include: {
            benefit: true
          }
        }
      }
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Se não tem benefícios do plano, o assinante não tem acesso
    if (benefitIdsDoPlano.length > 0 && parceiro.benefitAccess.length === 0) {
      return NextResponse.json({ error: 'Você não tem acesso a este parceiro' }, { status: 403 })
    }

    // Formatar benefícios
    const beneficios = parceiro.benefitAccess.map(ba => {
      const value = ba.benefit.value as Record<string, number>
      return {
        id: ba.benefit.id,
        name: ba.benefit.name,
        type: ba.benefit.type,
        value: value.percentage || value.monthlyPoints || 0,
        description: ba.benefit.description
      }
    })

    // Extrair dados de contato e endereço
    const contact = parceiro.contact as Record<string, string> || {}
    const address = parceiro.address as Record<string, string> || {}

    return NextResponse.json({
      parceiro: {
        id: parceiro.id,
        name: parceiro.tradeName || parceiro.companyName,
        tradeName: parceiro.tradeName,
        companyName: parceiro.companyName,
        description: parceiro.description,
        category: parceiro.category,
        logo: parceiro.logo,
        banner: parceiro.banner,
        gallery: parceiro.gallery || [],
        phone: contact.phone,
        whatsapp: contact.whatsapp,
        email: parceiro.user?.email,
        website: contact.website,
        instagram: contact.instagram,
        facebook: contact.facebook,
        address: address.street,
        addressNumber: address.number,
        neighborhood: address.neighborhood,
        complement: address.complement,
        zipCode: address.zipCode,
        city: parceiro.city,
        benefits: beneficios
      }
    })

  } catch (error) {
    console.error('Erro ao buscar parceiro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Registrar ação (whatsapp_click, page_view)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body

    // Buscar parceiro
    const parceiro = await prisma.parceiro.findUnique({
      where: { id },
      select: { id: true, metrics: true }
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Atualizar métricas
    const currentMetrics = parceiro.metrics as Record<string, number> || {
      pageViews: 0,
      whatsappClicks: 0,
      totalSales: 0,
      salesAmount: 0
    }

    if (action === 'whatsapp_click') {
      currentMetrics.whatsappClicks = (currentMetrics.whatsappClicks || 0) + 1
    } else if (action === 'page_view') {
      currentMetrics.pageViews = (currentMetrics.pageViews || 0) + 1
    }

    await prisma.parceiro.update({
      where: { id },
      data: { metrics: currentMetrics }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao registrar ação:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
