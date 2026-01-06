import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const newEmail = 'dev@unicabeneficios.com.br'
    const newPassword = 'Unica@2026#'
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Buscar o developer atual
    const developer = await prisma.user.findFirst({
      where: {
        role: 'DEVELOPER'
      }
    })

    if (!developer) {
      return NextResponse.json({ error: 'Developer não encontrado' }, { status: 404 })
    }

    // Atualizar email e senha
    await prisma.user.update({
      where: { id: developer.id },
      data: {
        email: newEmail,
        password: hashedPassword,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Developer atualizado!',
      email: newEmail,
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}
