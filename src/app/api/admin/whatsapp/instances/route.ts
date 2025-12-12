import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Função auxiliar para obter configs da Evolution API
async function getEvolutionConfig() {
  const configs = await prisma.config.findMany({
    where: {
      key: { in: ['evolution_api_url', 'evolution_api_key'] }
    }
  })
  
  const configMap: Record<string, string> = {}
  configs.forEach(c => { configMap[c.key] = c.value })
  
  return {
    url: configMap.evolution_api_url,
    apiKey: configMap.evolution_api_key,
  }
}

// GET - Listar instâncias
export async function GET() {
  console.log('[WHATSAPP API] GET /instances - Iniciando')
  
  try {
    const session = await auth()
    
    if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
      console.log('[WHATSAPP API] Não autorizado - session:', session?.user?.role)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('[WHATSAPP API] Usuário autenticado:', session.user.email)

    const instances = await prisma.whatsAppInstance.findMany({
      orderBy: { createdAt: 'desc' }
    })

    console.log('[WHATSAPP API] Instâncias encontradas:', instances.length)

    return NextResponse.json(instances)
  } catch (error) {
    console.error('[WHATSAPP API] Erro ao buscar instâncias:', error)
    return NextResponse.json({ error: 'Erro ao buscar instâncias' }, { status: 500 })
  }
}

// POST - Criar nova instância
export async function POST(request: Request) {
  const session = await auth()
  
  if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { name } = await request.json()
  
  if (!name) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  }

  // Gerar ID único para a instância
  const instanceId = `unica_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`

  try {
    const { url, apiKey } = await getEvolutionConfig()
    
    if (!url || !apiKey) {
      return NextResponse.json({ error: 'Evolution API não configurada' }, { status: 400 })
    }

    // Criar instância na Evolution API
    const evolutionResponse = await fetch(`${url}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        instanceName: instanceId,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    })

    if (!evolutionResponse.ok) {
      const errorData = await evolutionResponse.json().catch(() => ({}))
      console.error('Evolution API error:', errorData)
      return NextResponse.json({ error: 'Erro ao criar instância na Evolution API' }, { status: 500 })
    }

    // Salvar no banco de dados
    const instance = await prisma.whatsAppInstance.create({
      data: {
        name,
        instanceId,
        status: 'disconnected',
      },
    })

    return NextResponse.json(instance)
  } catch (error) {
    console.error('Erro ao criar instância:', error)
    return NextResponse.json({ error: 'Erro interno ao criar instância' }, { status: 500 })
  }
}

