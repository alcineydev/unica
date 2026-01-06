import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createVerificationCode } from '@/lib/verification'
import { sendVerificationCode } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { newEmail } = await request.json()

    if (!newEmail) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 })
    }

    // Verificar se e-mail já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Este e-mail já está em uso' }, { status: 400 })
    }

    // Gerar código de verificação
    const code = await createVerificationCode(newEmail, 'EMAIL_CHANGE')

    // Enviar código para o novo e-mail
    await sendVerificationCode(newEmail, session.user.name || 'Developer', code)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao iniciar mudança de e-mail:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
