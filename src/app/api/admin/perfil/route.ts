import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - Buscar dados do perfil do admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        pendingEmail: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Buscar dados do Admin
    let adminData = null
    if (user.role === 'ADMIN' || user.role === 'DEVELOPER') {
      adminData = await prisma.admin.findUnique({
        where: { userId: session.user.id },
        select: {
          id: true,
          name: true,
          phone: true,
          facebook: true,
          instagram: true,
          tiktok: true,
          youtube: true,
          cep: true,
          logradouro: true,
          numero: true,
          complemento: true,
          bairro: true,
          cidade: true,
          estado: true,
        }
      })
    }

    return NextResponse.json({
      ...user,
      admin: adminData
    })
  } catch (error) {
    console.error('[PERFIL GET] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 })
  }
}

// PUT - Atualizar dados do perfil do admin
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      // Senha
      currentPassword,
      newPassword,
      // Redes sociais
      facebook,
      instagram,
      tiktok,
      youtube,
      // Contato
      phone,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      // Nome
      name,
    } = body

    // Buscar usuário atual
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Se está alterando senha, validar
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Senha atual é obrigatória' }, { status: 400 })
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
      }

      const isValid = await bcrypt.compare(currentPassword, user.password || '')
      if (!isValid) {
        return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
      }

      // Atualizar senha
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword }
      })
    }

    // Atualizar phone no User
    if (phone !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { phone: phone || null }
      })
    }

    // Atualizar dados do Admin
    if (user.role === 'ADMIN' || user.role === 'DEVELOPER') {
      await prisma.admin.upsert({
        where: { userId: session.user.id },
        update: {
          name: name || undefined,
          phone: phone || undefined,
          facebook: facebook || null,
          instagram: instagram || null,
          tiktok: tiktok || null,
          youtube: youtube || null,
          cep: cep || null,
          logradouro: logradouro || null,
          numero: numero || null,
          complemento: complemento || null,
          bairro: bairro || null,
          cidade: cidade || null,
          estado: estado || null,
        },
        create: {
          userId: session.user.id,
          name: name || 'Admin',
          phone: phone || '',
          facebook: facebook || null,
          instagram: instagram || null,
          tiktok: tiktok || null,
          youtube: youtube || null,
          cep: cep || null,
          logradouro: logradouro || null,
          numero: numero || null,
          complemento: complemento || null,
          bairro: bairro || null,
          cidade: cidade || null,
          estado: estado || null,
        }
      })
    }

    return NextResponse.json({
      message: newPassword ? 'Perfil e senha atualizados!' : 'Perfil atualizado!'
    })
  } catch (error) {
    console.error('[PERFIL PUT] Erro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
