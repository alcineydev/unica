import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Por enquanto, retorna lista vazia
    // TODO: Implementar sistema de notificações in-app
    return NextResponse.json({
      notificacoes: []
    })

  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar notificações' },
      { status: 500 }
    )
  }
}
