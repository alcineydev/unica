import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Buscar assinante por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || !['ADMIN', 'DEVELOPER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { id } = await params

    const assinante = await prisma.assinante.findUnique({
      where: { id },
      include: {
        user: true,
        plan: true
      }
    })

    if (!assinante) {
      return NextResponse.json({ error: 'Assinante nao encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      assinante: {
        id: assinante.id,
        name: assinante.name,
        email: assinante.user.email,
        phone: assinante.phone || assinante.user.phone,
        cpf: assinante.cpf,
        avatar: assinante.user.avatar,
        dataNascimento: assinante.birthDate?.toISOString().split('T')[0] || null,
        endereco: assinante.address as any,
        subscriptionStatus: assinante.subscriptionStatus,
        points: assinante.points,
        cashback: assinante.cashback,
        qrCode: assinante.qrCode,
        plan: assinante.plan ? {
          id: assinante.plan.id,
          name: assinante.plan.name
        } : null,
        createdAt: assinante.createdAt.toISOString(),
        updatedAt: assinante.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('[ADMIN ASSINANTE GET] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar assinante' }, { status: 500 })
  }
}

// PUT - Atualizar assinante
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || !['ADMIN', 'DEVELOPER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const {
      name,
      phone,
      cpf,
      dataNascimento,
      endereco,
      subscriptionStatus,
      planId
    } = body

    // Verificar se assinante existe
    const assinanteExistente = await prisma.assinante.findUnique({
      where: { id }
    })

    if (!assinanteExistente) {
      return NextResponse.json({ error: 'Assinante nao encontrado' }, { status: 404 })
    }

    // Atualizar assinante - pontos e cashback nao sao editaveis manualmente
    const assinante = await prisma.assinante.update({
      where: { id },
      data: {
        name,
        phone,
        cpf,
        birthDate: dataNascimento ? new Date(dataNascimento) : null,
        address: endereco || undefined,
        subscriptionStatus,
        planId: planId || null
      },
      include: {
        user: true,
        plan: true
      }
    })

    // Atualizar telefone no User tambem
    if (phone) {
      await prisma.user.update({
        where: { id: assinante.userId },
        data: { phone }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Assinante atualizado com sucesso',
      assinante
    })

  } catch (error) {
    console.error('[ADMIN ASSINANTE PUT] Erro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar assinante' }, { status: 500 })
  }
}

// DELETE - Excluir assinante
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || !['ADMIN', 'DEVELOPER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Buscar assinante para pegar userId
    const assinante = await prisma.assinante.findUnique({
      where: { id }
    })

    if (!assinante) {
      return NextResponse.json({ error: 'Assinante nao encontrado' }, { status: 404 })
    }

    // Deletar assinante e user em transacao
    await prisma.$transaction([
      prisma.assinante.delete({ where: { id } }),
      prisma.user.delete({ where: { id: assinante.userId } })
    ])

    return NextResponse.json({
      success: true,
      message: 'Assinante excluido com sucesso'
    })

  } catch (error) {
    console.error('[ADMIN ASSINANTE DELETE] Erro:', error)
    return NextResponse.json({ error: 'Erro ao excluir assinante' }, { status: 500 })
  }
}
