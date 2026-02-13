import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Buscar perfil completo do assinante
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        avatar: true,
        phone: true,
        createdAt: true,
        assinante: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                period: true,
                features: true,
              },
            },
            city: {
              select: {
                id: true,
                name: true,
                state: true,
              },
            },
            _count: {
              select: {
                transactions: true,
                avaliacoes: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const assinante = user.assinante

    return NextResponse.json({
      id: user.id,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone || assinante?.phone || null,
      createdAt: user.createdAt,
      // Dados do assinante
      name: assinante?.name || '',
      cpf: assinante?.cpf || null,
      birthDate: assinante?.birthDate || null,
      address: assinante?.address || null,
      // Plano
      plan: assinante?.plan || null,
      planId: assinante?.planId || null,
      subscriptionStatus: assinante?.subscriptionStatus || 'PENDING',
      planStartDate: assinante?.planStartDate || null,
      planEndDate: assinante?.planEndDate || null,
      // Saldo
      points: Number(assinante?.points || 0),
      cashback: Number(assinante?.cashback || 0),
      // QR Code
      qrCode: assinante?.qrCode || null,
      // Cidade
      city: assinante?.city || null,
      cityId: assinante?.cityId || null,
      // Stats
      totalTransactions: assinante?._count?.transactions || 0,
      totalAvaliacoes: assinante?._count?.avaliacoes || 0,
    })
  } catch (error) {
    console.error('[PERFIL GET]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT - Atualizar perfil do assinante
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, birthDate, address, avatar, cpf, cityId } = body

    // Buscar user e assinante
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { assinante: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar CPF duplicado se informado
    if (cpf && user.assinante) {
      const cleanCpf = cpf.replace(/\D/g, '')
      if (cleanCpf.length === 11 && cleanCpf !== user.assinante.cpf) {
        const existing = await prisma.assinante.findUnique({
          where: { cpf: cleanCpf },
        })
        if (existing) {
          return NextResponse.json(
            { error: 'Este CPF já está em uso' },
            { status: 400 }
          )
        }
      }
    }

    // Atualizar em transação
    await prisma.$transaction(async (tx) => {
      // Atualizar User
      const userData: Record<string, unknown> = {}
      if (avatar !== undefined) userData.avatar = avatar
      if (phone !== undefined)
        userData.phone = phone ? phone.replace(/\D/g, '') : null

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: session.user.id },
          data: userData,
        })
      }

      // Atualizar Assinante (se existir)
      if (user.assinante) {
        const assinanteData: Record<string, unknown> = {}
        if (name !== undefined) assinanteData.name = name.trim()
        if (phone !== undefined)
          assinanteData.phone = phone ? phone.replace(/\D/g, '') : null
        if (birthDate !== undefined)
          assinanteData.birthDate = birthDate ? new Date(birthDate) : null
        if (address !== undefined) assinanteData.address = address
        if (cpf !== undefined)
          assinanteData.cpf = cpf ? cpf.replace(/\D/g, '') : null
        if (cityId !== undefined) assinanteData.cityId = cityId || null

        if (Object.keys(assinanteData).length > 0) {
          await tx.assinante.update({
            where: { id: user.assinante.id },
            data: assinanteData,
          })
        }
      }
    })

    return NextResponse.json({ message: 'Perfil atualizado com sucesso' })
  } catch (error) {
    console.error('[PERFIL PUT]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
