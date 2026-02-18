import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// GET - Buscar assinante por QR Code ou CPF
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !['PARCEIRO', 'DEVELOPER', 'ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const qrcode = searchParams.get('qrcode')
    const cpf = searchParams.get('cpf')

    if (!qrcode && !cpf) {
      return NextResponse.json({ error: 'Informe QR Code ou CPF' }, { status: 400 })
    }

    // Buscar parceiro logado
    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id },
      include: {
        benefitAccess: {
          include: { benefit: true }
        }
      }
    })

    // Buscar assinante - aceitar múltiplos formatos
    let assinante = null
    const valorBusca = qrcode || cpf || ''
    const valorLimpo = valorBusca.replace(/\D/g, '') // Remove não-numéricos

    // Tentar buscar por diferentes campos
    assinante = await prisma.assinante.findFirst({
      where: {
        OR: [
          { id: valorBusca }, // ID direto
          { qrCode: valorBusca }, // Campo qrCode
          { cpf: valorLimpo }, // CPF limpo
          { userId: valorBusca }, // User ID
        ]
      },
      include: {
        user: true,
        plan: {
          include: {
            planBenefits: {
              include: { benefit: true }
            }
          }
        }
      }
    })

    // Se não encontrou e parece ser um JSON, tentar parsear
    if (!assinante && valorBusca.startsWith('{')) {
      try {
        const qrData = JSON.parse(valorBusca)
        const idFromQR = qrData.id || qrData.assinanteId || qrData.cpf

        if (idFromQR) {
          assinante = await prisma.assinante.findFirst({
            where: {
              OR: [
                { id: idFromQR },
                { qrCode: idFromQR },
                { cpf: idFromQR.replace(/\D/g, '') },
                { userId: idFromQR }
              ]
            },
            include: {
              user: true,
              plan: {
                include: {
                  planBenefits: {
                    include: { benefit: true }
                  }
                }
              }
            }
          })
        }
      } catch {
        // Não é JSON, continua
      }
    }

    if (!assinante) {
      return NextResponse.json({
        error: 'Assinante não encontrado',
        detail: 'Verifique se o QR Code é válido ou tente buscar pelo CPF'
      }, { status: 404 })
    }

    // Filtrar benefícios que o assinante TEM (pelo plano) E que o parceiro OFERECE
    const beneficiosDoPlano = assinante.plan?.planBenefits.map(pb => pb.benefit) || []
    const beneficiosDoParceiro = parceiro?.benefitAccess?.map(ba => ba.benefit) || []

    // Se for admin/developer, mostrar todos os benefícios do plano
    const beneficiosDisponiveis = session.user.role === 'PARCEIRO'
      ? beneficiosDoPlano.filter(bp => beneficiosDoParceiro.some(bpar => bpar.id === bp.id))
      : beneficiosDoPlano

    return NextResponse.json({
      assinante: {
        id: assinante.id,
        nome: assinante.name || assinante.user?.email?.split('@')[0] || 'Sem nome',
        email: assinante.user?.email || '',
        telefone: assinante.phone || '',
        cpf: assinante.cpf || '',
        foto: assinante.user?.avatar,
        plano: {
          id: assinante.plan?.id || '',
          nome: assinante.plan?.name || 'Sem plano'
        },
        status: assinante.subscriptionStatus,
        pontos: assinante.points || 0,
        cashback: assinante.cashback || 0,
        beneficiosDisponiveis: beneficiosDisponiveis.map(b => ({
          id: b.id,
          nome: b.name,
          tipo: b.type,
          valor: b.value
        }))
      }
    })

  } catch (error) {
    console.error('[VALIDAR] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar assinante' }, { status: 500 })
  }
}

// POST - Registrar uso do benefício
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !['PARCEIRO', 'DEVELOPER', 'ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { assinanteId, beneficioId, valor } = body

    if (!assinanteId || !beneficioId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Buscar parceiro
    const parceiro = await prisma.parceiro.findFirst({
      where: { userId: session.user.id }
    })

    // Buscar assinante
    const assinante = await prisma.assinante.findUnique({
      where: { id: assinanteId },
      include: { user: true }
    })

    if (!assinante) {
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
    }

    // Verificar se assinante está ativo
    if (assinante.subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json({ error: 'Assinante não possui assinatura ativa' }, { status: 400 })
    }

    // Buscar benefício
    const beneficio = await prisma.benefit.findUnique({
      where: { id: beneficioId }
    })

    if (!beneficio) {
      return NextResponse.json({ error: 'Benefício não encontrado' }, { status: 404 })
    }

    // Calcular desconto/cashback baseado no tipo do benefício
    const valorCompra = valor || 0
    let rawValue = beneficio.value
    if (typeof rawValue === 'string') {
      try { rawValue = JSON.parse(rawValue) } catch { rawValue = {} }
    }
    const valueObj = (rawValue as Record<string, number>) || {}
    const percentual = valueObj.percentage || valueObj.value || 0

    let discountApplied = 0
    let cashbackGanho = 0
    const pontosGanhos = 1 // 1 ponto por transação (gamificação)

    if (beneficio.type === 'DESCONTO' && valorCompra > 0) {
      // DESCONTO: economia imediata
      discountApplied = (valorCompra * percentual) / 100
    } else if (beneficio.type === 'CASHBACK' && valorCompra > 0) {
      // CASHBACK: crédito para uso futuro
      cashbackGanho = (valorCompra * percentual) / 100
    }

    const parceiroId = parceiro?.id

    // Atualizar pontos do assinante (gamificação) + cashback se houver
    await prisma.assinante.update({
      where: { id: assinanteId },
      data: {
        points: { increment: pontosGanhos },
        ...(cashbackGanho > 0 && { cashback: { increment: cashbackGanho } }),
      },
    })

    // Atualizar CashbackBalance por parceiro
    if (cashbackGanho > 0 && parceiroId) {
      await prisma.cashbackBalance.upsert({
        where: {
          assinanteId_parceiroId: {
            assinanteId: assinante.id,
            parceiroId,
          },
        },
        update: {
          balance: { increment: cashbackGanho },
          totalEarned: { increment: cashbackGanho },
        },
        create: {
          assinanteId: assinante.id,
          parceiroId,
          balance: cashbackGanho,
          totalEarned: cashbackGanho,
          totalUsed: 0,
        },
      })
    }

    // Criar Transaction (ESSENCIAL para histórico de vendas)
    if (parceiroId && valorCompra > 0) {
      await prisma.transaction.create({
        data: {
          type: 'PURCHASE',
          assinanteId: assinante.id,
          parceiroId,
          amount: valorCompra,
          pointsUsed: 0,
          cashbackGenerated: cashbackGanho,
          cashbackUsed: 0,
          discountApplied,
          description: `${beneficio.name} - ${beneficio.type === 'DESCONTO' ? `${percentual}% desconto` : `${percentual}% cashback`}`,
          status: 'COMPLETED',
          metadata: {
            beneficioId,
            beneficioNome: beneficio.name,
            beneficioTipo: beneficio.type,
            percentual,
          },
        },
      })
    }

    logger.log('[VALIDAR] Benefício validado:', {
      assinanteId,
      assinanteNome: assinante.name || 'Assinante',
      beneficioId,
      beneficioNome: beneficio.name,
      parceiroId,
      parceiroNome: parceiro?.tradeName,
      pontosGanhos,
      cashbackGanho,
      discountApplied,
      valorCompra,
      data: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: `Benefício validado com sucesso! +1 ponto${cashbackGanho > 0 ? ` + R$${cashbackGanho.toFixed(2)} cashback` : ''}${discountApplied > 0 ? ` + R$${discountApplied.toFixed(2)} desconto` : ''}`,
      registro: {
        assinante: assinante.name || 'Assinante',
        beneficio: beneficio.name,
        parceiro: parceiro?.tradeName || 'Admin',
        pontosGanhos,
        cashbackGanho,
        discountApplied,
        valorCompra,
        data: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[VALIDAR] Erro:', error)
    return NextResponse.json({ error: 'Erro ao validar benefício' }, { status: 500 })
  }
}
