import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar senha mínima
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Buscar token válido
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Link inválido ou expirado' },
        { status: 400 }
      )
    }

    // Verificar se já foi usado
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Este link já foi utilizado' },
        { status: 400 }
      )
    }

    // Verificar expiração
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'Este link expirou. Solicite um novo.' },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Atualizar senha do usuário
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword }
    })

    // Marcar token como usado
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    })

    // Invalidar outros tokens do usuário
    await prisma.passwordResetToken.updateMany({
      where: { 
        userId: resetToken.userId,
        id: { not: resetToken.id }
      },
      data: { used: true }
    })

    console.log(`[RESET-PASSWORD] Senha alterada para usuário: ${resetToken.user.email}`)

    return NextResponse.json({ 
      success: true,
      message: 'Senha alterada com sucesso!'
    })

  } catch (error) {
    console.error('[RESET-PASSWORD] Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao redefinir senha' },
      { status: 500 }
    )
  }
}
