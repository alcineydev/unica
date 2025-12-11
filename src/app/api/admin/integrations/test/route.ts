import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { initMercadoPago, initEvolutionApi, initEmailService } from '@/services'

export const runtime = 'nodejs'

// POST - Testar conexão de uma integração
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DEVELOPER')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { type, config } = body

    let success = false
    let message = ''

    switch (type) {
      case 'PAYMENT': {
        if (!config.accessToken) {
          return NextResponse.json({ 
            success: false, 
            message: 'Access Token é obrigatório' 
          })
        }
        
        const mp = initMercadoPago({ 
          accessToken: config.accessToken,
          publicKey: config.publicKey,
        })
        
        success = await mp.testConnection()
        message = success 
          ? 'Conexão com Mercado Pago estabelecida!' 
          : 'Falha ao conectar com Mercado Pago. Verifique o Access Token.'
        break
      }

      case 'EVOLUTION_API': {
        if (!config.baseUrl || !config.apiKey) {
          return NextResponse.json({ 
            success: false, 
            message: 'URL da API e API Key são obrigatórios' 
          })
        }
        
        const evolution = initEvolutionApi({
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          instanceName: config.instanceName,
        })
        
        success = await evolution.testConnection()
        message = success 
          ? 'Conexão com Evolution API estabelecida!' 
          : 'Falha ao conectar com Evolution API. Verifique as credenciais.'
        break
      }

      case 'EMAIL': {
        if (!config.apiKey) {
          return NextResponse.json({ 
            success: false, 
            message: 'API Key é obrigatória' 
          })
        }
        
        const email = initEmailService({
          apiKey: config.apiKey,
          fromEmail: config.fromEmail,
          fromName: config.fromName,
        })
        
        success = await email.testConnection()
        message = success 
          ? 'Conexão com Resend estabelecida!' 
          : 'Falha ao conectar com Resend. Verifique a API Key.'
        break
      }

      default:
        return NextResponse.json({ 
          success: false, 
          message: 'Tipo de integração não suportado' 
        })
    }

    return NextResponse.json({ success, message })
  } catch (error) {
    console.error('Erro ao testar integração:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao testar conexão'
    })
  }
}

