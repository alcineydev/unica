import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getDefaultWhatsAppInstance,
  setDefaultWhatsAppInstance
} from '@/lib/notifications-multicanal'

// GET - Buscar instância padrão
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || !['DEVELOPER', 'ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const instance = await getDefaultWhatsAppInstance()

    return NextResponse.json({
      success: true,
      instance
    })

  } catch (error) {
    console.error('[WHATSAPP-DEFAULT] Erro:', error)
    return NextResponse.json({
      error: 'Erro ao buscar instância padrão'
    }, { status: 500 })
  }
}

// POST - Definir instância padrão
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !['DEVELOPER', 'ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { instanceId } = body

    if (!instanceId) {
      return NextResponse.json({ error: 'instanceId é obrigatório' }, { status: 400 })
    }

    const instance = await setDefaultWhatsAppInstance(instanceId)

    return NextResponse.json({
      success: true,
      instance,
      message: 'Instância definida como padrão'
    })

  } catch (error) {
    console.error('[WHATSAPP-DEFAULT] Erro:', error)
    return NextResponse.json({
      error: 'Erro ao definir instância padrão'
    }, { status: 500 })
  }
}
