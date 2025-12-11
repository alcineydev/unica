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

export async function GET(
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

    // Buscar estado da conexão
    const stateResponse = await fetch(`${url}/instance/connectionState/${instanceId}`, {
      headers: { 'apikey': apiKey },
    })

    let status = 'disconnected'
    let phoneNumber = null
    let profileName = null
    let profilePic = null

    if (stateResponse.ok) {
      const stateData = await stateResponse.json()
      status = stateData.instance?.state === 'open' ? 'connected' : 'disconnected'
    }

    // Se conectado, buscar info do perfil
    if (status === 'connected') {
      const profileResponse = await fetch(`${url}/instance/fetchInstances?instanceName=${instanceId}`, {
        headers: { 'apikey': apiKey },
      })

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        const instance = Array.isArray(profileData) ? profileData[0] : profileData
        
        if (instance) {
          phoneNumber = instance.owner || instance.profilePictureUrl?.split('@')[0]
          profileName = instance.profileName || instance.pushname
          profilePic = instance.profilePicUrl || instance.profilePictureUrl
        }
      }
    }

    return NextResponse.json({
      status,
      phoneNumber,
      profileName,
      profilePic,
    })
  } catch (error) {
    console.error('Erro ao verificar status:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

