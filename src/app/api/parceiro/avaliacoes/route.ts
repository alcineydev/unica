import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Por enquanto retornar vazio - implementar quando tiver modelo de avaliação
    return NextResponse.json({ 
      avaliacoes: [],
      stats: { media: 0, total: 0 }
    })

  } catch (error) {
    console.error('Erro ao buscar avaliações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

