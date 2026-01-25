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

    // Mascarar a API key para exibição (mostrar apenas últimos 8 caracteres)
    const apiKey = configMap['asaas_api_key'] || ''
    const apiKeyMasked = apiKey 
      ? '•'.repeat(Math.min(apiKey.length - 8, 32)) + apiKey.slice(-8) 
      : ''

    // Mascarar webhook token também
    const webhookToken = configMap['asaas_webhook_token'] || ''
    const webhookTokenMasked = webhookToken
      ? '•'.repeat(Math.min(webhookToken.length - 4, 20)) + webhookToken.slice(-4)
      : ''

    return NextResponse.json({
      environment: configMap['asaas_environment'] || 'sandbox',
      apiKey: '', // Nunca retornar a chave real
      apiKeyMasked,
      webhookToken: '', // Nunca retornar o token real
      webhookTokenMasked,
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

    // Só atualizar API key se não for o valor mascarado
    if (apiKey && !apiKey.includes('•')) {
      updates.push(
        prisma.config.upsert({
          where: { key: 'asaas_api_key' },
          update: { value: apiKey },
          create: {
            key: 'asaas_api_key',
            value: apiKey,
            description: 'API Key do Asaas',
            category: 'INTEGRATION',
          },
        })
      )
    }

    // Só atualizar webhook token se não for o valor mascarado
    if (webhookToken && !webhookToken.includes('•')) {
      updates.push(
        prisma.config.upsert({
          where: { key: 'asaas_webhook_token' },
          update: { value: webhookToken },
          create: {
            key: 'asaas_webhook_token',
            value: webhookToken,
            description: 'Token do Webhook Asaas',
            category: 'INTEGRATION',
          },
        })
      )
    }

    await Promise.all(updates)

    return NextResponse.json({ success: true, message: 'Configurações salvas com sucesso!' })
  } catch (error) {
    console.error('[ASAAS CONFIG] Erro ao salvar:', error)
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}

