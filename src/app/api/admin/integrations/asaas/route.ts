import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// GET - Buscar configurações do Asaas
export async function GET() {
  try {
    const session = await auth()
    
    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('[ASAAS CONFIG GET] Buscando configurações...')

    const configs = await prisma.config.findMany({
      where: {
        key: {
          startsWith: 'asaas_'
        }
      }
    })

    console.log('[ASAAS CONFIG GET] Encontradas:', configs.length, 'configs')
    console.log('[ASAAS CONFIG GET] Keys:', configs.map(c => c.key))

    const configMap: Record<string, string> = {}
    configs.forEach(config => {
      configMap[config.key] = config.value || ''
    })

    // Valores reais (nunca retornar para o frontend)
    const apiKey = configMap['asaas_api_key'] || ''
    const webhookToken = configMap['asaas_webhook_token'] || ''
    const environment = configMap['asaas_environment'] || 'sandbox'

    console.log('[ASAAS CONFIG GET] apiKey exists:', !!apiKey, 'length:', apiKey.length)
    console.log('[ASAAS CONFIG GET] webhookToken exists:', !!webhookToken, 'length:', webhookToken.length)
    console.log('[ASAAS CONFIG GET] environment:', environment)

    // Calcular flags ANTES de mascarar
    const hasApiKey = apiKey.length > 0
    const hasWebhookToken = webhookToken.length > 0

    // Mascarar para exibição (mostrar apenas últimos caracteres)
    const apiKeyMasked = hasApiKey 
      ? '••••' + apiKey.slice(-8) 
      : ''

    const webhookTokenMasked = hasWebhookToken
      ? '••••' + webhookToken.slice(-4)
      : ''

    // Log do que será retornado
    console.log('[ASAAS CONFIG GET] Retornando:', {
      environment,
      hasApiKey,
      hasWebhookToken,
      apiKeyMaskedLength: apiKeyMasked.length,
      webhookTokenMaskedLength: webhookTokenMasked.length
    })

    return NextResponse.json({
      environment,
      hasApiKey,
      hasWebhookToken,
      apiKeyMasked,
      webhookTokenMasked,
    })
  } catch (error) {
    console.error('[ASAAS CONFIG GET] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
  }
}

// PUT - Salvar configurações do Asaas
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    console.log('[ASAAS CONFIG PUT] Body recebido:', JSON.stringify({
      environment: body.environment,
      apiKey: body.apiKey ? `SET (${body.apiKey.length} chars)` : 'NOT_SET',
      webhookToken: body.webhookToken ? `SET (${body.webhookToken.length} chars)` : 'NOT_SET'
    }))

    const { environment, apiKey, webhookToken } = body

    // Validar ambiente
    if (!environment || !['sandbox', 'production'].includes(environment)) {
      return NextResponse.json({ error: 'Ambiente inválido' }, { status: 400 })
    }

    // Salvar ambiente
    console.log('[ASAAS CONFIG PUT] Salvando environment:', environment)
    await saveConfig('asaas_environment', environment, 'Ambiente do Asaas')

    // Salvar API Key se fornecida
    if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0 && !apiKey.includes('•')) {
      console.log('[ASAAS CONFIG PUT] Salvando apiKey, length:', apiKey.trim().length)
      await saveConfig('asaas_api_key', apiKey.trim(), 'API Key do Asaas')
    } else {
      console.log('[ASAAS CONFIG PUT] apiKey NÃO será salva:', { 
        exists: !!apiKey, 
        isString: typeof apiKey === 'string',
        length: apiKey?.length,
        hasMask: apiKey?.includes('•')
      })
    }

    // Salvar Webhook Token se fornecido
    if (webhookToken && typeof webhookToken === 'string' && webhookToken.trim().length > 0 && !webhookToken.includes('•')) {
      console.log('[ASAAS CONFIG PUT] Salvando webhookToken, length:', webhookToken.trim().length)
      await saveConfig('asaas_webhook_token', webhookToken.trim(), 'Token do Webhook Asaas')
    } else {
      console.log('[ASAAS CONFIG PUT] webhookToken NÃO será salvo:', {
        exists: !!webhookToken,
        isString: typeof webhookToken === 'string',
        length: webhookToken?.length,
        hasMask: webhookToken?.includes('•')
      })
    }

    // Verificar se salvou
    const verify = await prisma.config.findMany({
      where: { key: { startsWith: 'asaas_' } }
    })
    console.log('[ASAAS CONFIG PUT] Verificação após salvar:', verify.map(c => ({ 
      key: c.key, 
      hasValue: !!c.value,
      valueLength: c.value?.length 
    })))

    return NextResponse.json({ success: true, message: 'Configurações salvas com sucesso!' })
  } catch (error) {
    console.error('[ASAAS CONFIG PUT] Erro:', error)
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}

async function saveConfig(key: string, value: string, description: string) {
  console.log(`[ASAAS CONFIG] saveConfig chamado: key=${key}, valueLength=${value.length}`)
  
  try {
    // Verificar se existe
    const existing = await prisma.config.findUnique({ where: { key } })
    console.log(`[ASAAS CONFIG] Registro existente para ${key}:`, existing ? `SIM (id: ${existing.id})` : 'NÃO')

    if (existing) {
      // Atualizar
      const updated = await prisma.config.update({
        where: { key },
        data: { value }
      })
      console.log(`[ASAAS CONFIG] Atualizado ${key}: id=${updated.id}, newValueLength=${updated.value?.length}`)
    } else {
      // Criar
      const created = await prisma.config.create({
        data: {
          key,
          value,
          description,
          category: 'INTEGRATION',
        }
      })
      console.log(`[ASAAS CONFIG] Criado ${key}: id=${created.id}, valueLength=${created.value?.length}`)
    }

    // Verificar se salvou
    const verify = await prisma.config.findUnique({ where: { key } })
    console.log(`[ASAAS CONFIG] Verificação ${key}:`, verify ? `value.length=${verify.value?.length}` : 'NÃO ENCONTRADO')

  } catch (error) {
    console.error(`[ASAAS CONFIG] Erro ao salvar ${key}:`, error)
    throw error
  }
}
