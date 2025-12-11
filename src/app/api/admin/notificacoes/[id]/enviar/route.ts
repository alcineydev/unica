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

// Função para formatar número de telefone brasileiro
function formatPhoneNumber(phone: string): string {
  // Remove tudo que não for número
  const cleaned = phone.replace(/\D/g, '')
  
  // Se já começa com 55, retorna
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    return cleaned
  }
  
  // Adiciona 55 se não tiver
  return `55${cleaned}`
}

// Função para enviar mensagem via Evolution API
async function sendWhatsAppMessage(
  url: string,
  apiKey: string,
  instanceId: string,
  phoneNumber: string,
  message: string,
  imageUrl?: string | null
): Promise<boolean> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    // Se tem imagem, enviar como media
    if (imageUrl) {
      const response = await fetch(`${url}/message/sendMedia/${instanceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          number: formattedPhone,
          mediatype: 'image',
          caption: message,
          media: imageUrl,
        }),
      })
      
      return response.ok
    }
    
    // Enviar apenas texto
    const response = await fetch(`${url}/message/sendText/${instanceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message,
      }),
    })
    
    return response.ok
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return false
  }
}

// POST - Enviar notificação
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Buscar notificação
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        instance: true,
      },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }

    // Buscar configs da Evolution API
    const { url, apiKey } = await getEvolutionConfig()
    
    if (!url || !apiKey) {
      return NextResponse.json({ error: 'Evolution API não configurada' }, { status: 400 })
    }

    // Atualizar status para SENDING
    await prisma.notification.update({
      where: { id },
      data: { status: 'SENDING' },
    })

    // Buscar destinatários baseado no targetType
    const recipients: { phone: string }[] = []

    // Se for envio individual, usar apenas o número informado
    if (notification.targetType === 'INDIVIDUAL' && notification.individualNumber) {
      recipients.push({ phone: notification.individualNumber })
    } else {
      // Buscar destinatários baseado no targetType
      switch (notification.targetType) {
        case 'TODOS':
        const [assinantes1, parceiros1] = await Promise.all([
          prisma.assinante.findMany({
            where: {
              user: { isActive: true },
              phone: { not: '' },
            },
            select: { phone: true },
          }),
          prisma.parceiro.findMany({
            where: {
              user: { isActive: true },
              isActive: true,
            },
            select: { contact: true },
          }),
        ])
        
        recipients.push(...assinantes1)
        // Extrair telefone do JSON contact dos parceiros
        parceiros1.forEach(p => {
          const contact = p.contact as { whatsapp?: string; phone?: string }
          if (contact?.whatsapp || contact?.phone) {
            recipients.push({ phone: contact.whatsapp || contact.phone || '' })
          }
        })
        break

      case 'ALL_ASSINANTES':
        const assinantes2 = await prisma.assinante.findMany({
          where: {
            user: { isActive: true },
            phone: { not: '' },
          },
          select: { phone: true },
        })
        recipients.push(...assinantes2)
        break

      case 'PLANO_ESPECIFICO':
        if (notification.targetPlanId) {
          const assinantes3 = await prisma.assinante.findMany({
            where: {
              planId: notification.targetPlanId,
              user: { isActive: true },
              phone: { not: '' },
            },
            select: { phone: true },
          })
          recipients.push(...assinantes3)
        }
        break

      case 'ALL_PARCEIROS':
        const parceiros2 = await prisma.parceiro.findMany({
          where: {
            user: { isActive: true },
            isActive: true,
          },
          select: { contact: true },
        })
        parceiros2.forEach(p => {
          const contact = p.contact as { whatsapp?: string; phone?: string }
          if (contact?.whatsapp || contact?.phone) {
            recipients.push({ phone: contact.whatsapp || contact.phone || '' })
          }
        })
        break

      case 'PARCEIROS_CIDADE':
        if (notification.targetCityId) {
          const parceiros3 = await prisma.parceiro.findMany({
            where: {
              cityId: notification.targetCityId,
              user: { isActive: true },
              isActive: true,
            },
            select: { contact: true },
          })
          parceiros3.forEach(p => {
            const contact = p.contact as { whatsapp?: string; phone?: string }
            if (contact?.whatsapp || contact?.phone) {
              recipients.push({ phone: contact.whatsapp || contact.phone || '' })
            }
          })
        }
        break
      }
    }

    // Montar mensagem completa
    let fullMessage = notification.message
    if (notification.linkUrl && notification.linkText) {
      fullMessage += `\n\n${notification.linkText}: ${notification.linkUrl}`
    } else if (notification.linkUrl) {
      fullMessage += `\n\n${notification.linkUrl}`
    }

    // Enviar mensagens
    let sentCount = 0
    let failedCount = 0
    const errorLogs: string[] = []

    for (const recipient of recipients) {
      if (!recipient.phone) {
        failedCount++
        errorLogs.push(`Telefone vazio`)
        continue
      }

      // Delay entre mensagens para evitar bloqueio
      await new Promise(resolve => setTimeout(resolve, 1000))

      const success = await sendWhatsAppMessage(
        url,
        apiKey,
        notification.instance.instanceId,
        recipient.phone,
        fullMessage,
        notification.imageUrl
      )

      if (success) {
        sentCount++
      } else {
        failedCount++
        errorLogs.push(`Falha ao enviar para ${recipient.phone}`)
      }
    }

    // Determinar status final
    let finalStatus = 'SENT'
    if (sentCount === 0 && failedCount > 0) {
      finalStatus = 'FAILED'
    } else if (sentCount > 0 && failedCount > 0) {
      finalStatus = 'PARTIAL'
    }

    // Atualizar notificação
    await prisma.notification.update({
      where: { id },
      data: {
        status: finalStatus,
        sentCount,
        failedCount,
        sentAt: new Date(),
        errorLog: errorLogs.length > 0 ? errorLogs.join('\n') : null,
      },
    })

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      status: finalStatus,
    })
  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
    
    // Atualizar status para FAILED
    await prisma.notification.update({
      where: { id },
      data: { 
        status: 'FAILED',
        errorLog: error instanceof Error ? error.message : 'Erro desconhecido',
      },
    })

    return NextResponse.json({ error: 'Erro ao enviar notificação' }, { status: 500 })
  }
}

