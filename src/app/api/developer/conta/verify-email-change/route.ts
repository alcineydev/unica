import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCode } from '@/lib/verification'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { newEmail, code } = await request.json()

    if (!newEmail || !code) {
      return NextResponse.json({ error: 'E-mail e código são obrigatórios' }, { status: 400 })
    }

    // Verificar código
    const result = await verifyCode(newEmail, code, 'EMAIL_CHANGE')

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Atualizar e-mail do usuário
    await prisma.user.update({
      where: { id: session.user.id },
      data: { email: newEmail },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao verificar mudança de e-mail:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
