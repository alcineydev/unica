import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
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
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('[PERFIL GET] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, currentPassword, newPassword } = body

    // Buscar usuário atual
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Se está alterando senha, verificar senha atual
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Senha atual é obrigatória' }, { status: 400 })
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password || '')
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'A nova senha deve ter pelo menos 6 caracteres' }, { status: 400 })
      }
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {
      phone
    }

    // Se tem nova senha, fazer hash
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 12)
    }

    // Atualizar usuário
    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData
    })

    // Se tem nome, atualizar no perfil específico (Admin ou outro)
    if (name && session.user.role === 'ADMIN') {
      await prisma.admin.updateMany({
        where: { userId: session.user.id },
        data: { name }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PERFIL PUT] Erro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
