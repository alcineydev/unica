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

    // Primeiro verificar status da conexão
    const statusResponse = await fetch(`${url}/instance/connectionState/${instanceId}`, {
      headers: { 'apikey': apiKey },
    })

    if (statusResponse.ok) {
      const statusData = await statusResponse.json()
      if (statusData.instance?.state === 'open') {
        return NextResponse.json({ status: 'connected' })
      }
    }

    // Se não conectado, buscar QR Code
    const qrResponse = await fetch(`${url}/instance/connect/${instanceId}`, {
      headers: { 'apikey': apiKey },
    })

    if (!qrResponse.ok) {
      return NextResponse.json({ error: 'Erro ao obter QR Code' }, { status: 500 })
    }

    const qrData = await qrResponse.json()
    
    // A Evolution API pode retornar o QR Code em diferentes formatos
    const qrCode = qrData.base64 || qrData.qrcode?.base64 || qrData.code
    
    if (qrCode) {
      // Se não for base64 completo, adicionar prefixo
      const base64Image = qrCode.startsWith('data:image') 
        ? qrCode 
        : `data:image/png;base64,${qrCode}`
      
      return NextResponse.json({ qrCode: base64Image })
    }

    return NextResponse.json({ error: 'QR Code não disponível' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao obter QR Code:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

