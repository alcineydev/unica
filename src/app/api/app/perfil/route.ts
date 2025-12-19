import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Buscar dados do perfil
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const assinante = await prisma.assinante.findFirst({
      where: { userId: session.user.id },
      include: {
        user: true,
        plan: true
      }
    })

    if (!assinante) {
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      perfil: {
        id: assinante.id,
        nome: assinante.name,
        email: assinante.user.email,
        telefone: assinante.phone || assinante.user.phone,
        cpf: assinante.cpf,
        avatar: assinante.user.avatar,
        dataNascimento: assinante.birthDate?.toISOString().split('T')[0] || null,
        endereco: assinante.address || null,
        plano: assinante.plan ? {
          id: assinante.plan.id,
          nome: assinante.plan.name
        } : null,
        status: assinante.subscriptionStatus,
        pontos: assinante.points || 0,
        cashback: assinante.cashback || 0,
        qrCode: assinante.qrCode,
        membroDesde: assinante.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('[PERFIL GET] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 })
  }
}

// PUT - Atualizar dados do perfil
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { nome, telefone, dataNascimento, endereco, avatar } = body

    // Buscar assinante
    const assinanteExistente = await prisma.assinante.findFirst({
      where: { userId: session.user.id }
    })

    if (!assinanteExistente) {
      return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 })
    }

    // Atualizar assinante
    await prisma.assinante.update({
      where: { id: assinanteExistente.id },
      data: {
        name: nome,
        phone: telefone?.replace(/\D/g, ''),
        birthDate: dataNascimento ? new Date(dataNascimento) : undefined,
        address: endereco || undefined
      }
    })

    // Atualizar avatar e telefone no User
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phone: telefone?.replace(/\D/g, ''),
        avatar: avatar || undefined
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso!'
    })

  } catch (error) {
    console.error('[PERFIL PUT] Erro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
