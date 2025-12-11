/**
 * Serviço de integração com Evolution API (WhatsApp)
 * Documentação: https://doc.evolution-api.com/
 */

interface EvolutionApiConfig {
  baseUrl: string
  apiKey: string
  instanceName?: string
}

interface SendMessageData {
  phone: string
  message: string
}

interface SendMediaData {
  phone: string
  mediaUrl: string
  caption?: string
  mediaType: 'image' | 'video' | 'audio' | 'document'
}

interface SendTemplateData {
  phone: string
  templateName: string
  templateData: Record<string, string>
}

interface MessageResponse {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message: Record<string, unknown>
  status: string
}

interface InstanceStatus {
  instance: string
  state: 'open' | 'close' | 'connecting'
  status: string
}

class EvolutionApiService {
  private baseUrl: string
  private apiKey: string
  private instanceName: string

  constructor(config: EvolutionApiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.apiKey = config.apiKey
    this.instanceName = config.instanceName || 'unica'
  }

  private formatPhone(phone: string): string {
    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '')
    
    // Adiciona código do país se necessário
    if (cleaned.length === 11) {
      return `55${cleaned}`
    }
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return cleaned
    }
    
    return cleaned
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'apikey': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Erro ${response.status}`)
    }

    return response.json()
  }

  /**
   * Verificar status da instância
   */
  async getInstanceStatus(): Promise<InstanceStatus> {
    return this.request<InstanceStatus>(
      `/instance/connectionState/${this.instanceName}`
    )
  }

  /**
   * Enviar mensagem de texto
   */
  async sendTextMessage(data: SendMessageData): Promise<MessageResponse> {
    const phone = this.formatPhone(data.phone)

    return this.request<MessageResponse>(
      `/message/sendText/${this.instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify({
          number: phone,
          text: data.message,
        }),
      }
    )
  }

  /**
   * Enviar mídia (imagem, vídeo, áudio, documento)
   */
  async sendMedia(data: SendMediaData): Promise<MessageResponse> {
    const phone = this.formatPhone(data.phone)

    return this.request<MessageResponse>(
      `/message/sendMedia/${this.instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify({
          number: phone,
          mediatype: data.mediaType,
          media: data.mediaUrl,
          caption: data.caption,
        }),
      }
    )
  }

  /**
   * Enviar mensagem usando template
   */
  async sendTemplate(data: SendTemplateData): Promise<MessageResponse> {
    // Templates devem ser configurados na Evolution API
    // Este método é um wrapper para facilitar o uso
    const phone = this.formatPhone(data.phone)
    
    // Substituir variáveis no template
    let message = data.templateName
    for (const [key, value] of Object.entries(data.templateData)) {
      message = message.replace(`{{${key}}}`, value)
    }

    return this.sendTextMessage({ phone, message })
  }

  /**
   * Enviar notificação de venda para assinante
   */
  async sendSaleNotification(
    phone: string,
    data: {
      partnerName: string
      amount: number
      pointsUsed: number
      cashbackGenerated: number
    }
  ): Promise<MessageResponse> {
    const message = `🛒 *Compra Registrada!*\n\n` +
      `Parceiro: ${data.partnerName}\n` +
      `Valor: R$ ${data.amount.toFixed(2)}\n` +
      (data.pointsUsed > 0 ? `Pontos usados: ${data.pointsUsed}\n` : '') +
      (data.cashbackGenerated > 0 ? `Cashback gerado: R$ ${data.cashbackGenerated.toFixed(2)}\n` : '') +
      `\n✅ Obrigado por usar o Unica Clube!`

    return this.sendTextMessage({ phone, message })
  }

  /**
   * Enviar notificação de boas-vindas
   */
  async sendWelcomeMessage(
    phone: string,
    data: { name: string; planName: string }
  ): Promise<MessageResponse> {
    const message = `🎉 *Bem-vindo ao Unica Clube de Benefícios!*\n\n` +
      `Olá, ${data.name}!\n\n` +
      `Sua assinatura do plano *${data.planName}* foi ativada com sucesso.\n\n` +
      `Agora você pode aproveitar descontos exclusivos em nossos parceiros!\n\n` +
      `📱 Acesse o app para ver todos os benefícios disponíveis.`

    return this.sendTextMessage({ phone, message })
  }

  /**
   * Enviar lembrete de pagamento
   */
  async sendPaymentReminder(
    phone: string,
    data: { name: string; dueDate: string; amount: number }
  ): Promise<MessageResponse> {
    const message = `⚠️ *Lembrete de Pagamento*\n\n` +
      `Olá, ${data.name}!\n\n` +
      `Sua assinatura vence em ${data.dueDate}.\n` +
      `Valor: R$ ${data.amount.toFixed(2)}\n\n` +
      `Mantenha sua assinatura ativa para continuar aproveitando os benefícios!`

    return this.sendTextMessage({ phone, message })
  }

  /**
   * Testar conexão
   */
  async testConnection(): Promise<boolean> {
    try {
      const status = await this.getInstanceStatus()
      return status.state === 'open'
    } catch {
      return false
    }
  }
}

// Singleton instance
let evolutionApiInstance: EvolutionApiService | null = null

export function getEvolutionApi(): EvolutionApiService | null {
  if (!evolutionApiInstance && process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY) {
    evolutionApiInstance = new EvolutionApiService({
      baseUrl: process.env.EVOLUTION_API_URL,
      apiKey: process.env.EVOLUTION_API_KEY,
      instanceName: process.env.EVOLUTION_INSTANCE_NAME,
    })
  }
  return evolutionApiInstance
}

export function initEvolutionApi(config: EvolutionApiConfig): EvolutionApiService {
  evolutionApiInstance = new EvolutionApiService(config)
  return evolutionApiInstance
}

export { EvolutionApiService, type EvolutionApiConfig, type SendMessageData, type MessageResponse }

