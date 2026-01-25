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

    const configs = await prisma.config.findMany({
      where: {
        key: {
          startsWith: 'asaas_'
        }
      }
    })

    const configMap: Record<string, string> = {}
    configs.forEach(config => {
      configMap[config.key] = config.value
    })

    // Valores reais (nunca retornar para o frontend)
    const apiKey = configMap['asaas_api_key'] || ''
    const webhookToken = configMap['asaas_webhook_token'] || ''

    // Mascarar para exibição (mostrar apenas últimos caracteres)
    const apiKeyMasked = apiKey 
      ? '•'.repeat(Math.max(0, Math.min(apiKey.length - 8, 32))) + apiKey.slice(-8) 
      : ''

    const webhookTokenMasked = webhookToken
      ? '•'.repeat(Math.max(0, Math.min(webhookToken.length - 4, 20))) + webhookToken.slice(-4)
      : ''

    console.log('[ASAAS CONFIG GET] environment:', configMap['asaas_environment'], 
      '| hasApiKey:', !!apiKey, 
      '| hasWebhookToken:', !!webhookToken)

    return NextResponse.json({
      environment: configMap['asaas_environment'] || 'sandbox',
      // Nunca retornar valores reais
      apiKey: '',
      webhookToken: '',
      // Valores mascarados para exibição
      apiKeyMasked,
      webhookTokenMasked,
      // Flags indicando se existe valor salvo
      hasApiKey: apiKey.length > 0,
      hasWebhookToken: webhookToken.length > 0,
    })
  } catch (error) {
    console.error('[ASAAS CONFIG] Erro ao buscar:', error)
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
    const { environment, apiKey, webhookToken } = body

    console.log('[ASAAS CONFIG PUT] Recebido:', { 
      environment, 
      apiKey: apiKey ? `SET (${apiKey.length} chars)` : 'NOT_SET',
      webhookToken: webhookToken ? `SET (${webhookToken.length} chars)` : 'NOT_SET'
    })

    // Validações
    if (!environment || !['sandbox', 'production'].includes(environment)) {
      return NextResponse.json({ error: 'Ambiente inválido' }, { status: 400 })
    }

    // Atualizar ou criar configs
    const updates = []

    // Sempre salvar o ambiente
    updates.push(
      prisma.config.upsert({
        where: { key: 'asaas_environment' },
        update: { value: environment },
        create: {
          key: 'asaas_environment',
          value: environment,
          description: 'Ambiente do Asaas (sandbox/production)',
          category: 'INTEGRATION',
        },
      })
    )
    console.log('[ASAAS CONFIG PUT] Ambiente será salvo:', environment)

    // Só atualizar API key se foi fornecida e não é vazia
    // Importante: string vazia ou undefined NÃO sobrescreve valor existente
    if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0 && !apiKey.includes('•')) {
      const trimmedApiKey = apiKey.trim()
      updates.push(
        prisma.config.upsert({
          where: { key: 'asaas_api_key' },
          update: { value: trimmedApiKey },
          create: {
            key: 'asaas_api_key',
            value: trimmedApiKey,
            description: 'API Key do Asaas',
            category: 'INTEGRATION',
          },
        })
      )
      console.log('[ASAAS CONFIG PUT] API Key será salva (', trimmedApiKey.length, 'chars)')
    } else {
      console.log('[ASAAS CONFIG PUT] API Key NÃO será atualizada (mantendo valor existente)')
    }

    // Só atualizar webhook token se foi fornecido e não é vazio
    if (webhookToken && typeof webhookToken === 'string' && webhookToken.trim().length > 0 && !webhookToken.includes('•')) {
      const trimmedToken = webhookToken.trim()
      updates.push(
        prisma.config.upsert({
          where: { key: 'asaas_webhook_token' },
          update: { value: trimmedToken },
          create: {
            key: 'asaas_webhook_token',
            value: trimmedToken,
            description: 'Token do Webhook Asaas',
            category: 'INTEGRATION',
          },
        })
      )
      console.log('[ASAAS CONFIG PUT] Webhook Token será salvo (', trimmedToken.length, 'chars)')
    } else {
      console.log('[ASAAS CONFIG PUT] Webhook Token NÃO será atualizado (mantendo valor existente)')
    }

    await Promise.all(updates)
    console.log('[ASAAS CONFIG PUT] Configurações salvas com sucesso!')

    return NextResponse.json({ success: true, message: 'Configurações salvas com sucesso!' })
  } catch (error) {
    console.error('[ASAAS CONFIG] Erro ao salvar:', error)
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
