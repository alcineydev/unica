import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createVerificationCode } from '@/lib/verification'
import { sendVerificationCode } from '@/lib/email'

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

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Gera código
    const code = await createVerificationCode(email)

    // Pega o nome do assinante ou usa 'Usuário' como fallback
    const name = user.assinante?.name || 'Usuário'

    // Envia e-mail
    const result = await sendVerificationCode(email, name, code)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Erro ao enviar e-mail' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Código enviado' })
  } catch (error) {
    console.error('Erro ao enviar código:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
