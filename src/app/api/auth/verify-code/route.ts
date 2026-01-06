import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyCode } from '@/lib/verification'

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'E-mail e código são obrigatórios' },
        { status: 400 }
      )
    }

    // Verifica código
    const result = await verifyCode(email, code)

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Atualiza usuário como verificado
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    })

    return NextResponse.json({ success: true, message: 'E-mail verificado' })
  } catch (error) {
    console.error('Erro ao verificar código:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
