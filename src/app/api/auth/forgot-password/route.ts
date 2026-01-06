import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPasswordResetToken } from '@/lib/verification'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail é obrigatório' },
        { status: 400 }
      )
    }

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email },
      include: { assinante: true },
    })

    // Por segurança, sempre retorna sucesso (não revela se e-mail existe)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Se o e-mail existir, você receberá um link de recuperação'
      })
    }

    // Gera token
    const token = await createPasswordResetToken(email)

    // Pega o nome do assinante ou usa 'Usuário' como fallback
    const name = user.assinante?.name || 'Usuário'

    // Envia e-mail
    await sendPasswordResetEmail(email, name, token)

    return NextResponse.json({
      success: true,
      message: 'Se o e-mail existir, você receberá um link de recuperação'
    })
  } catch (error) {
    console.error('Erro ao processar recuperação:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
