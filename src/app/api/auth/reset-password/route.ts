import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyResetToken, consumeResetToken } from '@/lib/verification'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verifica token
    const result = await verifyResetToken(token)

    if (!result.valid || !result.email) {
      return NextResponse.json(
        { error: result.error || 'Token inválido' },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Atualiza senha do usuário
    await prisma.user.update({
      where: { email: result.email },
      data: { password: hashedPassword },
    })

    // Marca token como usado
    await consumeResetToken(token)

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    })
  } catch (error) {
    console.error('Erro ao redefinir senha:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
