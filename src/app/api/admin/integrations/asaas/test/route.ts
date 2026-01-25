import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// POST - Testar conexão com Asaas
export async function POST() {
  try {
    const session = await auth()
    
    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar configurações
    const configs = await prisma.config.findMany({
      where: { key: { startsWith: 'asaas_' } }
    })

    const configMap: Record<string, string> = {}
    configs.forEach(config => {
      configMap[config.key] = config.value
    })

    const environment = configMap['asaas_environment'] || 'sandbox'
    const apiKey = configMap['asaas_api_key']

    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'API Key não configurada. Salve a configuração primeiro.' 
      }, { status: 400 })
    }

    // URL base do Asaas
    const baseUrl = environment === 'production' 
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3'

    // Testar conexão buscando informações da conta
    const response = await fetch(`${baseUrl}/myAccount`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'access_token': apiKey
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      if (response.status === 401) {
        return NextResponse.json({ 
          success: false, 
          error: 'API Key inválida ou expirada',
        }, { status: 400 })
      }

      return NextResponse.json({ 
        success: false, 
        error: errorData.errors?.[0]?.description || `Erro na API do Asaas (${response.status})`,
      }, { status: 400 })
    }

    const accountData = await response.json()

    return NextResponse.json({ 
      success: true, 
      message: 'Conexão estabelecida com sucesso!',
      account: {
        name: accountData.name || accountData.commercialName,
        email: accountData.email,
        cpfCnpj: accountData.cpfCnpj ? 
          accountData.cpfCnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') :
          null,
        environment: environment,
        walletId: accountData.walletId
      }
    })
  } catch (error) {
    console.error('[ASAAS TEST] Erro:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao testar conexão. Verifique sua internet.' 
    }, { status: 500 })
  }
}

