import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'

// POST - Testar conexão com Evolution API
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { url, apiKey } = await request.json()

    if (!url || !apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'URL e API Key são obrigatórios' 
      })
    }

    // Testar conexão buscando instâncias
    const response = await fetch(`${url}/instance/fetchInstances`, {
      headers: {
        'apikey': apiKey,
      },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({ 
        success: true, 
        message: 'Conexão estabelecida com sucesso!',
        instances: Array.isArray(data) ? data.length : 0
      })
    } else {
      const errorText = await response.text()
      return NextResponse.json({ 
        success: false, 
        error: `Falha na autenticação: ${response.status} - ${errorText}`
      })
    }
  } catch (error) {
    console.error('Erro ao testar Evolution API:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Não foi possível conectar à API'
    })
  }
}

