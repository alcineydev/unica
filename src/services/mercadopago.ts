/**
 * Serviço de integração com Mercado Pago
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs
 */

interface MercadoPagoConfig {
  accessToken: string
  publicKey?: string
  webhookUrl?: string
}

interface CreatePaymentData {
  amount: number
  description: string
  payerEmail: string
  payerName: string
  payerCpf: string
  externalReference?: string
}

interface PaymentResponse {
  id: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  statusDetail: string
  paymentMethodId: string
  transactionAmount: number
  dateCreated: string
  externalReference?: string
  pixQrCode?: string
  pixQrCodeBase64?: string
}

interface SubscriptionData {
  planId: string
  payerEmail: string
  payerName: string
  payerCpf: string
  cardToken?: string
}

class MercadoPagoService {
  private accessToken: string
  private baseUrl = 'https://api.mercadopago.com'

  constructor(config: MercadoPagoConfig) {
    this.accessToken = config.accessToken
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
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
   * Criar pagamento PIX
   */
  async createPixPayment(data: CreatePaymentData): Promise<PaymentResponse> {
    const payload = {
      transaction_amount: data.amount,
      description: data.description,
      payment_method_id: 'pix',
      payer: {
        email: data.payerEmail,
        first_name: data.payerName.split(' ')[0],
        last_name: data.payerName.split(' ').slice(1).join(' ') || '',
        identification: {
          type: 'CPF',
          number: data.payerCpf,
        },
      },
      external_reference: data.externalReference,
    }

    const response = await this.request<{
      id: number
      status: string
      status_detail: string
      payment_method_id: string
      transaction_amount: number
      date_created: string
      external_reference?: string
      point_of_interaction?: {
        transaction_data?: {
          qr_code?: string
          qr_code_base64?: string
        }
      }
    }>('/v1/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return {
      id: response.id.toString(),
      status: response.status as PaymentResponse['status'],
      statusDetail: response.status_detail,
      paymentMethodId: response.payment_method_id,
      transactionAmount: response.transaction_amount,
      dateCreated: response.date_created,
      externalReference: response.external_reference,
      pixQrCode: response.point_of_interaction?.transaction_data?.qr_code,
      pixQrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64,
    }
  }

  /**
   * Consultar pagamento
   */
  async getPayment(paymentId: string): Promise<PaymentResponse> {
    const response = await this.request<{
      id: number
      status: string
      status_detail: string
      payment_method_id: string
      transaction_amount: number
      date_created: string
      external_reference?: string
    }>(`/v1/payments/${paymentId}`)

    return {
      id: response.id.toString(),
      status: response.status as PaymentResponse['status'],
      statusDetail: response.status_detail,
      paymentMethodId: response.payment_method_id,
      transactionAmount: response.transaction_amount,
      dateCreated: response.date_created,
      externalReference: response.external_reference,
    }
  }

  /**
   * Cancelar pagamento
   */
  async cancelPayment(paymentId: string): Promise<void> {
    await this.request(`/v1/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled' }),
    })
  }

  /**
   * Criar assinatura recorrente
   */
  async createSubscription(data: SubscriptionData): Promise<{ id: string; status: string }> {
    const payload = {
      preapproval_plan_id: data.planId,
      payer_email: data.payerEmail,
      card_token_id: data.cardToken,
      reason: 'Assinatura Unica Clube de Benefícios',
      external_reference: data.payerCpf,
    }

    const response = await this.request<{
      id: string
      status: string
    }>('/preapproval', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return {
      id: response.id,
      status: response.status,
    }
  }

  /**
   * Cancelar assinatura
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.request(`/preapproval/${subscriptionId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled' }),
    })
  }

  /**
   * Testar conexão
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request('/users/me')
      return true
    } catch {
      return false
    }
  }
}

// Singleton instance
let mercadoPagoInstance: MercadoPagoService | null = null

export function getMercadoPago(): MercadoPagoService | null {
  if (!mercadoPagoInstance && process.env.MERCADOPAGO_ACCESS_TOKEN) {
    mercadoPagoInstance = new MercadoPagoService({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
    })
  }
  return mercadoPagoInstance
}

export function initMercadoPago(config: MercadoPagoConfig): MercadoPagoService {
  mercadoPagoInstance = new MercadoPagoService(config)
  return mercadoPagoInstance
}

export { MercadoPagoService, type MercadoPagoConfig, type CreatePaymentData, type PaymentResponse }

