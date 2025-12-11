import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function getEvolutionConfig() {
  const configs = await prisma.config.findMany({
    where: { key: { in: ['evolution_api_url', 'evolution_api_key'] } }
  })
  const configMap: Record<string, string> = {}
  configs.forEach(c => { configMap[c.key] = c.value })
  return { url: configMap.evolution_api_url, apiKey: configMap.evolution_api_key }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const session = await auth()
  
  if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { instanceId } = await params

  try {
    const { url, apiKey } = await getEvolutionConfig()
    
    if (!url || !apiKey) {
      return NextResponse.json({ error: 'Evolution API não configurada' }, { status: 400 })
    }

    // Fazer logout na Evolution API
    await fetch(`${url}/instance/logout/${instanceId}`, {
      method: 'DELETE',
      headers: { 'apikey': apiKey },
    })

    // Atualizar status no banco
    await prisma.whatsAppInstance.updateMany({
      where: { instanceId },
      data: {
        status: 'disconnected',
        phoneNumber: null,
        profileName: null,
        profilePic: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao desconectar:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

