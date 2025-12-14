import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Por enquanto retornar vazio - implementar quando tiver modelo de validação
    return NextResponse.json({ validations: [] })

  } catch (error) {
    console.error('Erro ao buscar validações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
