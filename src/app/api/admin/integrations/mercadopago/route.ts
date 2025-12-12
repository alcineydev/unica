import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// GET - Buscar configurações do Mercado Pago
export async function GET() {
  try {
    const session = await auth()
    
    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const configs = await prisma.config.findMany({
      where: {
        key: {
          in: [
            'mercadopago_mode',
            'mercadopago_public_key',
            'mercadopago_access_token',
            'mercadopago_webhook_url',
          ],
        },
      },
    })

    // Converter para objeto e mascarar token
    const result: Record<string, string> = {}
    
    for (const config of configs) {
      if (config.key === 'mercadopago_access_token' && config.value) {
        // Mascarar token, mostrando apenas os últimos 4 caracteres
        const value = config.value
        result[config.key] = value.length > 4 
          ? '•'.repeat(Math.min(value.length - 4, 20)) + value.slice(-4)
          : '•'.repeat(value.length)
      } else {
        result[config.key] = config.value
      }
    }

    // Verificar se tem token real salvo (não mascarado)
    const hasAccessToken = configs.some(
      c => c.key === 'mercadopago_access_token' && c.value && c.value.length > 0
    )

    // Definir valores padrão se não existirem
    return NextResponse.json({
      mode: result.mercadopago_mode || 'sandbox',
      publicKey: result.mercadopago_public_key || '',
      accessToken: result.mercadopago_access_token || '',
      webhookUrl: result.mercadopago_webhook_url || '',
      hasAccessToken,
    })
  } catch (error) {
    console.error('Erro ao buscar configs do Mercado Pago:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Salvar configurações do Mercado Pago
export async function PUT(request: Request) {
  try {
    const session = await auth()
    
    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { mode, publicKey, accessToken, webhookUrl } = body

    // Validação básica
    if (!mode || !['sandbox', 'production'].includes(mode)) {
      return NextResponse.json(
        { error: 'Modo inválido. Use "sandbox" ou "production"' },
        { status: 400 }
      )
    }

    // Atualizar ou criar configs
    const updates = []

    updates.push(
      prisma.config.upsert({
        where: { key: 'mercadopago_mode' },
        update: { value: mode },
        create: {
          key: 'mercadopago_mode',
          value: mode,
          description: 'Modo do Mercado Pago (sandbox ou production)',
          category: 'PAYMENT',
        },
      })
    )

    if (publicKey !== undefined) {
      updates.push(
        prisma.config.upsert({
          where: { key: 'mercadopago_public_key' },
          update: { value: publicKey },
          create: {
            key: 'mercadopago_public_key',
            value: publicKey,
            description: 'Public Key do Mercado Pago',
            category: 'PAYMENT',
          },
        })
      )
    }

    // Só atualizar token se não for o valor mascarado
    if (accessToken && !accessToken.includes('•')) {
      updates.push(
        prisma.config.upsert({
          where: { key: 'mercadopago_access_token' },
          update: { value: accessToken },
          create: {
            key: 'mercadopago_access_token',
            value: accessToken,
            description: 'Access Token do Mercado Pago',
            category: 'PAYMENT',
          },
        })
      )
    }

    if (webhookUrl !== undefined) {
      updates.push(
        prisma.config.upsert({
          where: { key: 'mercadopago_webhook_url' },
          update: { value: webhookUrl },
          create: {
            key: 'mercadopago_webhook_url',
            value: webhookUrl,
            description: 'Webhook URL do Mercado Pago',
            category: 'PAYMENT',
          },
        })
      )
    }

    await Promise.all(updates)

    return NextResponse.json({ success: true, message: 'Configurações salvas com sucesso!' })
  } catch (error) {
    console.error('Erro ao salvar configs do Mercado Pago:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

