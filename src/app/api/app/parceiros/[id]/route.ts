import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Função para verificar se é um ID válido (cuid ou uuid)
function isValidId(str: string): boolean {
  // cuid: começa com 'c' e tem ~25 caracteres alfanuméricos
  const cuidRegex = /^c[a-z0-9]{20,30}$/i
  // uuid: formato padrão com hífens
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return cuidRegex.test(str) || uuidRegex.test(str)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    }

    console.log('[API Parceiro] Buscando:', id)

    // Verificar se o ID tem formato válido
    if (!isValidId(id)) {
      console.log('[API Parceiro] ID inválido:', id)
      return NextResponse.json({
        error: 'Parceiro não encontrado',
        detail: 'ID com formato inválido'
      }, { status: 404 })
    }

    // Buscar assinante e seu plano
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
    } catch (e) {
      console.warn('[API Parceiro] Erro ao buscar assinante (ignorando):', e)
    }

    // Buscar parceiro
    const parceiro = await prisma.parceiro.findUnique({
      where: { id },
      include: {
        city: true,
        user: {
          select: { email: true, isActive: true }
        },
        benefitAccess: {
          where: benefitIdsDoPlano.length > 0 ? {
            benefitId: { in: benefitIdsDoPlano }
          } : undefined,
          include: {
            benefit: true
          }
        }
      }
    })

    if (!parceiro) {
      console.log('[API Parceiro] Não encontrado com ID:', id)
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Verificar se parceiro está ativo
    if (!parceiro.isActive || !parceiro.user?.isActive) {
      return NextResponse.json({ error: 'Parceiro não disponível' }, { status: 404 })
    }

    console.log('[API Parceiro] Encontrado:', parceiro.tradeName || parceiro.companyName)

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

    // Buscar assinante para dados da mensagem WhatsApp
    let assinanteInfo = null
    try {
      const assinante = await prisma.assinante.findUnique({
        where: { userId: session.user.id! },
        include: { plan: true }
      })
      assinanteInfo = assinante
    } catch (e) {
      // Ignorar erro
    }

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
      },
      assinante: {
        id: assinanteInfo?.id || session.user.id,
        name: assinanteInfo?.name || session.user.name || 'Cliente',
        planName: assinanteInfo?.plan?.name || 'UNICA'
      }
    })

  } catch (error: any) {
    console.error('[API Parceiro] ERRO:', error?.message)
    console.error('[API Parceiro] Stack:', error?.stack)
    return NextResponse.json({
      error: 'Erro ao buscar parceiro',
      message: error?.message || 'Erro desconhecido'
    }, { status: 500 })
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

    // Verificar formato do ID
    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

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

  } catch (error: any) {
    console.error('[API Parceiro] Erro ao registrar ação:', error?.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
