import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas confirma que a regeneração foi solicitada
    // O manifest é gerado dinamicamente em /api/manifest
    return NextResponse.json({ success: true, message: 'Manifest será regenerado' })

  } catch (error) {
    console.error('Erro ao gerar manifest:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

