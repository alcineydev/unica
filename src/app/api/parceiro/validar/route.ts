import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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

    if (!parceiro && session.user.role === 'PARCEIRO') {
      return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
    }

    // Buscar assinante
    let assinante
    
    if (qrcode) {
      // QR Code pode ser o ID do assinante ou o qrCode gerado
      assinante = await prisma.assinante.findFirst({
        where: {
          OR: [
            { id: qrcode },
            { qrCode: qrcode },
            { cpf: qrcode.replace(/\D/g, '') }
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
    } else if (cpf) {
      assinante = await prisma.assinante.findFirst({
        where: { cpf: cpf.replace(/\D/g, '') },
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

    if (!assinante) {
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
    }

    // Filtrar benefícios que o assinante TEM (pelo plano) E que o parceiro OFERECE
    const beneficiosDoPlano = assinante.plan?.planBenefits.map(pb => pb.benefit) || []
    const beneficiosDoParceiro = parceiro?.benefitAccess.map(ba => ba.benefit) || []
    
    // Se for admin/dev, mostrar todos os benefícios do plano
    const beneficiosDisponiveis = session.user.role === 'PARCEIRO' 
      ? beneficiosDoPlano.filter(bp =>
          beneficiosDoParceiro.some(bpar => bpar.id === bp.id)
        )
      : beneficiosDoPlano

    return NextResponse.json({
      assinante: {
        id: assinante.id,
        nome: assinante.name,
        email: assinante.user?.email || '',
        telefone: assinante.phone,
        cpf: assinante.cpf || '',
        foto: assinante.user?.avatar,
        plano: {
          id: assinante.plan?.id || '',
          nome: assinante.plan?.name || 'Sem plano'
        },
        status: assinante.subscriptionStatus,
        pontos: Number(assinante.points),
        cashback: Number(assinante.cashback),
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
    const { assinanteId, beneficioId } = body

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

    // Registrar uso (incrementar métrica do parceiro se existir)
    if (parceiro) {
      await prisma.parceiro.update({
        where: { id: parceiro.id },
        data: {
          totalSales: { increment: 1 }
        }
      })
    }

    console.log('[VALIDAR] Uso registrado:', {
      assinanteId,
      assinanteNome: assinante.name,
      beneficioId,
      beneficioNome: beneficio.name,
      parceiroId: parceiro?.id,
      parceiroNome: parceiro?.tradeName,
      data: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Benefício validado com sucesso',
      registro: {
        assinante: assinante.name,
        beneficio: beneficio.name,
        parceiro: parceiro?.tradeName || 'Admin',
        data: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[VALIDAR] Erro:', error)
    return NextResponse.json({ error: 'Erro ao validar benefício' }, { status: 500 })
  }
}

