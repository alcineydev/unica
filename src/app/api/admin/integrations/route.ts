import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

export const runtime = 'nodejs'

const integrationSchema = z.object({
  type: z.enum(['EVOLUTION_API', 'PAYMENT', 'EMAIL', 'SMS']),
  name: z.string().min(1),
  config: z.record(z.string(), z.unknown()),
  isActive: z.boolean().optional(),
})

// GET - Listar integrações
export async function GET() {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DEVELOPER')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const integrations = await prisma.integration.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Ocultar dados sensíveis
    const safeIntegrations = integrations.map((integration) => {
      const config = integration.config as Record<string, unknown>
      const safeConfig: Record<string, unknown> = {}

      for (const [key, value] of Object.entries(config)) {
        if (typeof value === 'string' && (
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('key') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('password')
        )) {
          // Mostrar apenas os últimos 4 caracteres
          safeConfig[key] = value.length > 4 
            ? '•'.repeat(value.length - 4) + value.slice(-4)
            : '•'.repeat(value.length)
        } else {
          safeConfig[key] = value
        }
      }

      return {
        ...integration,
        config: safeConfig,
      }
    })

    return NextResponse.json(safeIntegrations)
  } catch (error) {
    console.error('Erro ao listar integrações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar/Atualizar integração
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DEVELOPER')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = integrationSchema.parse(body)

    // Verificar se já existe integração deste tipo
    const existing = await prisma.integration.findFirst({
      where: { type: validatedData.type },
    })

    let integration

    if (existing) {
      // Atualizar existente
      integration = await prisma.integration.update({
        where: { id: existing.id },
        data: {
          name: validatedData.name,
          config: validatedData.config as Prisma.JsonValue,
          isActive: validatedData.isActive ?? existing.isActive,
        },
      })
    } else {
      // Criar nova
      integration = await prisma.integration.create({
        data: {
          type: validatedData.type,
          name: validatedData.name,
          config: validatedData.config as Prisma.JsonValue,
          isActive: validatedData.isActive ?? true,
        },
      })
    }

    return NextResponse.json(integration, { status: existing ? 200 : 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erro ao salvar integração:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

