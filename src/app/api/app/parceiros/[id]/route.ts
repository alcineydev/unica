import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

// GET - Buscar detalhes de um parceiro específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ASSINANTE') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Buscar assinante para verificar cidade e plano
    const assinante = await prisma.assinante.findFirst({
      where: { user: { email: session.user.email } },
      include: {
        plan: {
          include: {
            planBenefits: {
              include: {
                benefit: true,
              },
            },
          },
        },
      },
    })

    if (!assinante) {
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
    }

    // Buscar parceiro
    const parceiro = await prisma.parceiro.findUnique({
      where: { id },
      include: {
        city: true,
        user: {
          select: {
            isActive: true,
          },
        },
        benefitAccess: {
          include: {
            benefit: true,
          },
        },
      },
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Verificar se parceiro está ativo
    if (!parceiro.isActive || !parceiro.user.isActive) {
      return NextResponse.json({ error: 'Parceiro não disponível' }, { status: 404 })
    }

    // Verificar se parceiro é da mesma cidade do assinante
    if (parceiro.cityId !== assinante.cityId) {
      return NextResponse.json({ error: 'Parceiro não disponível na sua cidade' }, { status: 403 })
    }

    // Incrementar pageViews
    const metrics = (parceiro.metrics as Record<string, number>) || {}
    await prisma.parceiro.update({
      where: { id },
      data: {
        metrics: {
          ...metrics,
          pageViews: (metrics.pageViews || 0) + 1,
        },
      },
    })

    // Calcular benefícios aplicáveis ao assinante neste parceiro
    const beneficiosAplicaveis = []
    
    for (const planBenefit of assinante.plan.planBenefits) {
      const benefit = planBenefit.benefit
      
      // Verificar se o benefício se aplica a este parceiro
      const parceiroTemBeneficio = parceiro.benefitAccess.some(
        (ba) => ba.benefitId === benefit.id
      )

      // Benefícios de categoria
      if (benefit.type === 'DESCONTO') {
        const value = benefit.value as { percentage?: number; category?: string }
        if (value.category === parceiro.category || parceiroTemBeneficio) {
          beneficiosAplicaveis.push({
            id: benefit.id,
            name: benefit.name,
            type: benefit.type,
            description: benefit.description,
            value: value,
          })
        }
      } else if (benefit.type === 'CASHBACK') {
        beneficiosAplicaveis.push({
          id: benefit.id,
          name: benefit.name,
          type: benefit.type,
          description: benefit.description,
          value: benefit.value,
        })
      } else if (benefit.type === 'ACESSO_EXCLUSIVO' && parceiroTemBeneficio) {
        beneficiosAplicaveis.push({
          id: benefit.id,
          name: benefit.name,
          type: benefit.type,
          description: benefit.description,
          value: benefit.value,
        })
      }
    }

    // Formatar resposta
    const response = {
      id: parceiro.id,
      companyName: parceiro.companyName,
      logo: parceiro.logo,
      category: parceiro.category,
      description: parceiro.description,
      city: parceiro.city,
      address: parceiro.address,
      contact: parceiro.contact,
      hours: parceiro.hours,
      beneficios: beneficiosAplicaveis,
      metrics: {
        pageViews: (metrics.pageViews || 0) + 1,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro ao buscar parceiro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Registrar clique no WhatsApp
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ASSINANTE') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    if (body.action === 'whatsapp_click') {
      const parceiro = await prisma.parceiro.findUnique({
        where: { id },
      })

      if (parceiro) {
        const metrics = (parceiro.metrics as Record<string, number>) || {}
        await prisma.parceiro.update({
          where: { id },
          data: {
            metrics: {
              ...metrics,
              whatsappClicks: (metrics.whatsappClicks || 0) + 1,
            },
          },
        })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao registrar ação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

