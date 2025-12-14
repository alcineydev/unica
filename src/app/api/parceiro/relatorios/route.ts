import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Dados placeholder - implementar quando tiver modelo de validação
    const stats = {
      validacoesHoje: 0,
      validacoesSemana: 0,
      validacoesMes: 0,
      crescimento: 0,
      topBeneficios: [],
      validacoesPorDia: []
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Erro ao buscar relatórios:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

