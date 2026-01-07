import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token é obrigatório' }, { status: 400 })
    }

    // Buscar mudança pendente
    const pendingChange = await prisma.pendingEmailChange.findUnique({
      where: { token },
    })

    if (!pendingChange) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 })
    }

    // Verificar expiração
    if (new Date() > pendingChange.expiresAt) {
      await prisma.pendingEmailChange.delete({ where: { id: pendingChange.id } })
      return NextResponse.json({ error: 'Token expirado' }, { status: 400 })
    }

    // Verificar se novo e-mail já foi usado
    const existingUser = await prisma.user.findUnique({
      where: { email: pendingChange.newEmail },
    })

    if (existingUser) {
      await prisma.pendingEmailChange.delete({ where: { id: pendingChange.id } })
      return NextResponse.json({ error: 'Este e-mail já está em uso' }, { status: 400 })
    }

    // Atualizar e-mail do usuário
    await prisma.user.update({
      where: { id: pendingChange.userId },
      data: { email: pendingChange.newEmail },
    })

    // Deletar a mudança pendente
    await prisma.pendingEmailChange.delete({ where: { id: pendingChange.id } })

    return NextResponse.json({
      success: true,
      message: 'E-mail alterado com sucesso',
      newEmail: pendingChange.newEmail
    })
  } catch (error) {
    console.error('Erro ao confirmar mudança de e-mail:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
