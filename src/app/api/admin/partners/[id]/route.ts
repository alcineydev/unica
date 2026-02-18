import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Helper: Calcular timeline de transações dos últimos 6 meses
function calculateTransactionTimeline(transactions: Array<{ createdAt: Date; amount: any }>) {
  const months: Record<string, { count: number; amount: number }> = {}
  const now = new Date()

  // Inicializar últimos 6 meses com 0
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = date.toISOString().slice(0, 7) // YYYY-MM
    months[key] = { count: 0, amount: 0 }
  }

  // Contar transações por mês
  transactions.forEach(t => {
    const key = t.createdAt.toISOString().slice(0, 7)
    if (months[key] !== undefined) {
      months[key].count++
      months[key].amount += Number(t.amount) || 0
    }
  })

  // Converter para array
  return Object.entries(months).map(([month, data]) => ({
    month,
    label: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short' }),
    count: data.count,
    amount: data.amount
  }))
}

// Helper: Calcular distribuição por status de transações
function calculateStatusDistribution(transactions: Array<{ status: string }>) {
  const distribution: Record<string, number> = {}

  transactions.forEach(t => {
    distribution[t.status] = (distribution[t.status] || 0) + 1
  })

  return Object.entries(distribution).map(([status, count]) => ({ status, count }))
}

// GET - Buscar parceiro com dados completos
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Buscar parceiro com todas as relações
    const parceiro = await prisma.parceiro.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true
          }
        },
        city: true,
        categoryRef: true,
        benefitAccess: {
          include: {
            benefit: true
          }
        },
        _count: {
          select: {
            transactions: true,
            benefitAccess: true,
            avaliacoes: true
          }
        }
      }
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Buscar todos os benefícios ativos (para seleção)
    const allBenefits = await prisma.benefit.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    // Buscar todas as categorias ativas
    const allCategories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    // Buscar todas as cidades ativas
    const allCities = await prisma.city.findMany({
      where: { isActive: true },
      orderBy: [
        { state: 'asc' },
        { name: 'asc' }
      ]
    })

    // Buscar transações do parceiro
    const transactions = await prisma.transaction.findMany({
      where: { parceiroId: id },
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        description: true,
        createdAt: true,
        assinante: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Buscar avaliações do parceiro
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { parceiroId: id },
      select: {
        id: true,
        nota: true,
        comentario: true,
        resposta: true,
        publicada: true,
        createdAt: true,
        assinante: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calcular estatísticas
    const transacoesCompleted = transactions.filter(t => t.status === 'COMPLETED')
    const receitaTotal = transacoesCompleted.reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const avaliacoesPublicadas = avaliacoes.filter(a => a.publicada)
    const mediaAvaliacao = avaliacoesPublicadas.length > 0
      ? avaliacoesPublicadas.reduce((sum, a) => sum + a.nota, 0) / avaliacoesPublicadas.length
      : 0

    // Transações do mês atual
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)
    const transacoesEsteMes = transactions.filter(t => t.createdAt >= inicioMes).length

    const stats = {
      totalTransacoes: transactions.length,
      transacoesCompleted: transacoesCompleted.length,
      transacoesEsteMes,
      receitaTotal,
      receitaEsteMes: transacoesCompleted
        .filter(t => t.createdAt >= inicioMes)
        .reduce((sum, t) => sum + Number(t.amount || 0), 0),
      mediaAvaliacao: Math.round(mediaAvaliacao * 10) / 10,
      totalAvaliacoes: avaliacoes.length,
      avaliacoesPublicadas: avaliacoesPublicadas.length,
      timeline: calculateTransactionTimeline(transactions),
      statusDistribution: calculateStatusDistribution(transactions)
    }

    // Últimas 5 transações
    const recentTransactions = transactions.slice(0, 5)

    // Últimas 3 avaliações
    const recentAvaliacoes = avaliacoes.slice(0, 3)

    return NextResponse.json({
      ...parceiro,
      allBenefits,
      allCategories,
      allCities,
      stats,
      recentTransactions,
      recentAvaliacoes
    })
  } catch (error) {
    console.error('[PARTNER GET]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Atualizar parceiro
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'DEVELOPER'].includes(user.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.parceiro.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    const {
      companyName,
      tradeName,
      description,
      categoryId,
      cityId,
      logo,
      banner,
      gallery,
      address,
      addressNumber,
      neighborhood,
      complement,
      zipCode,
      whatsapp,
      phone,
      website,
      instagram,
      facebook,
      isActive,
      isDestaque,
      bannerDestaque,
      destaqueOrder,
      benefitIds
    } = body

    // Montar objeto de endereço
    const addressData = {
      street: address || (existing.address as any)?.street || '',
      number: addressNumber || (existing.address as any)?.number || '',
      neighborhood: neighborhood || (existing.address as any)?.neighborhood || '',
      complement: complement || (existing.address as any)?.complement || '',
      zipCode: zipCode || (existing.address as any)?.zipCode || ''
    }

    // Montar objeto de contato
    const contactData = {
      whatsapp: whatsapp || (existing.contact as any)?.whatsapp || '',
      phone: phone || (existing.contact as any)?.phone || '',
      website: website || (existing.contact as any)?.website || '',
      instagram: instagram || (existing.contact as any)?.instagram || '',
      facebook: facebook || (existing.contact as any)?.facebook || ''
    }

    // Atualizar parceiro
    const parceiro = await prisma.parceiro.update({
      where: { id },
      data: {
        companyName: companyName?.trim() || existing.companyName,
        tradeName: tradeName?.trim() || existing.tradeName,
        description: description !== undefined ? description : existing.description,
        categoryId: categoryId || existing.categoryId,
        cityId: cityId || existing.cityId,
        logo: logo !== undefined ? logo : existing.logo,
        banner: banner !== undefined ? banner : existing.banner,
        gallery: gallery !== undefined ? gallery : existing.gallery,
        address: addressData,
        contact: contactData,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        isDestaque: isDestaque !== undefined ? isDestaque : existing.isDestaque,
        bannerDestaque: bannerDestaque !== undefined ? bannerDestaque : existing.bannerDestaque,
        destaqueOrder: destaqueOrder !== undefined ? destaqueOrder : existing.destaqueOrder,
      }
    })

    // Atualizar benefícios vinculados (se fornecido)
    if (benefitIds !== undefined && Array.isArray(benefitIds)) {
      // Remover todos os benefícios existentes
      await prisma.benefitAccess.deleteMany({
        where: { parceiroId: id }
      })

      // Adicionar novos benefícios
      if (benefitIds.length > 0) {
        await prisma.benefitAccess.createMany({
          data: benefitIds.map((benefitId: string) => ({
            parceiroId: id,
            benefitId
          }))
        })
      }
    }

    // Se isActive mudou, atualizar também o User
    if (isActive !== undefined && existing.user && isActive !== existing.isActive) {
      await prisma.user.update({
        where: { id: existing.user.id },
        data: { isActive }
      })
    }

    return NextResponse.json(parceiro)
  } catch (error) {
    console.error('[PARTNER PATCH]', error)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

// DELETE - Excluir parceiro
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'DEVELOPER'].includes(user.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id } = await params

    const parceiro = await prisma.parceiro.findUnique({
      where: { id },
      include: {
        _count: { select: { transactions: true } }
      }
    })

    if (!parceiro) {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    if (parceiro._count.transactions > 0) {
      return NextResponse.json({
        error: `Não é possível excluir: ${parceiro._count.transactions} transação(ões) vinculada(s)`
      }, { status: 400 })
    }

    // Remover benefícios vinculados
    await prisma.benefitAccess.deleteMany({
      where: { parceiroId: id }
    })

    // Remover avaliações
    await prisma.avaliacao.deleteMany({
      where: { parceiroId: id }
    })

    // Excluir user (cascade remove o parceiro)
    if (parceiro.userId) {
      await prisma.user.delete({ where: { id: parceiro.userId } })
    }

    return NextResponse.json({ message: 'Parceiro excluído com sucesso' })
  } catch (error) {
    console.error('[PARTNER DELETE]', error)
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
