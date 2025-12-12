import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'

// POST - Testar conexão com Mercado Pago
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { accessToken } = body

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Access Token é obrigatório' },
        { status: 400 }
      )
    }

    // Testar conexão buscando métodos de pagamento
    const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        message: `Conexão estabelecida! ${data.length} métodos de pagamento disponíveis.`,
        paymentMethods: data.length,
      })
    } else {
      const errorData = await response.json().catch(() => ({}))
      
      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          message: 'Access Token inválido ou expirado',
        })
      }
      
      return NextResponse.json({
        success: false,
        message: errorData.message || `Erro na API do Mercado Pago (${response.status})`,
      })
    }
  } catch (error) {
    console.error('Erro ao testar Mercado Pago:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro ao conectar com o Mercado Pago. Verifique sua conexão.',
    })
  }
}

