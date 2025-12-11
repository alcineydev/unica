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

// DELETE - Remover instância
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Buscar a instância para obter o instanceId
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id }
    })

    if (!instance) {
      return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 })
    }

    const { url, apiKey } = await getEvolutionConfig()
    
    // Deletar na Evolution API (ignorar erro se falhar)
    if (url && apiKey) {
      await fetch(`${url}/instance/delete/${instance.instanceId}`, {
        method: 'DELETE',
        headers: { 'apikey': apiKey },
      }).catch(err => console.log('Erro ao deletar na Evolution API:', err))
    }

    // Verificar se há notificações usando esta instância
    const notificationsCount = await prisma.notification.count({
      where: { instanceId: id }
    })

    if (notificationsCount > 0) {
      // Deletar notificações relacionadas primeiro
      await prisma.notification.deleteMany({
        where: { instanceId: id }
      })
    }

    // Deletar do banco
    await prisma.whatsAppInstance.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar instância:', error)
    return NextResponse.json({ error: 'Erro ao remover instância' }, { status: 500 })
  }
}

// PATCH - Atualizar instância
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const data = await request.json()

  try {
    const instance = await prisma.whatsAppInstance.update({
      where: { id },
      data: {
        status: data.status,
        phoneNumber: data.phoneNumber,
        profileName: data.profileName,
        profilePic: data.profilePic,
      },
    })

    return NextResponse.json(instance)
  } catch (error) {
    console.error('Erro ao atualizar instância:', error)
    return NextResponse.json({ error: 'Erro ao atualizar instância' }, { status: 500 })
  }
}
