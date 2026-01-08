const ASAAS_API_URL = process.env.ASAAS_ENVIRONMENT === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3'

const ASAAS_API_KEY = process.env.ASAAS_API_KEY

interface AsaasCustomer {
  id?: string
  name: string
  email: string
  cpfCnpj: string
  phone?: string
  mobilePhone?: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  externalReference?: string
}

interface AsaasPayment {
  id?: string
  customer: string
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED'
  value: number
  dueDate: string
  description?: string
  externalReference?: string
  installmentCount?: number
  installmentValue?: number
  discount?: {
    value: number
    dueDateLimitDays: number
    type: 'FIXED' | 'PERCENTAGE'
  }
  fine?: {
    value: number
    type: 'FIXED' | 'PERCENTAGE'
  }
  interest?: {
    value: number
    type: 'PERCENTAGE'
  }
  postalService?: boolean
}

interface AsaasSubscription {
  id?: string
  customer: string
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED'
  value: number
  nextDueDate: string
  cycle: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
  description?: string
  externalReference?: string
  maxPayments?: number
}

interface AsaasCreditCard {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}

interface AsaasCreditCardHolderInfo {
  name: string
  email: string
  cpfCnpj: string
  postalCode: string
  addressNumber: string
  phone: string
}

interface AsaasPixQrCode {
  encodedImage: string
  payload: string
  expirationDate: string
}

class AsaasClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!ASAAS_API_KEY) {
      throw new Error('ASAAS_API_KEY não configurada')
    }

    const response = await fetch(`${ASAAS_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Asaas API Error:', data)
      throw new Error(data.errors?.[0]?.description || 'Erro na API Asaas')
    }

    return data as T
  }

  // ==================== CUSTOMERS ====================

  async createCustomer(customer: AsaasCustomer): Promise<AsaasCustomer & { id: string }> {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    })
  }

  async getCustomer(id: string): Promise<AsaasCustomer & { id: string }> {
    return this.request(`/customers/${id}`)
  }

  async getCustomerByEmail(email: string): Promise<{ data: Array<AsaasCustomer & { id: string }> }> {
    return this.request(`/customers?email=${encodeURIComponent(email)}`)
  }

  async getCustomerByCpfCnpj(cpfCnpj: string): Promise<{ data: Array<AsaasCustomer & { id: string }> }> {
    return this.request(`/customers?cpfCnpj=${cpfCnpj}`)
  }

  async updateCustomer(id: string, customer: Partial<AsaasCustomer>): Promise<AsaasCustomer & { id: string }> {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    })
  }

  // ==================== PAYMENTS ====================

  async createPayment(payment: AsaasPayment): Promise<AsaasPayment & { id: string; invoiceUrl: string; bankSlipUrl?: string }> {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    })
  }

  async createPaymentWithCreditCard(
    payment: AsaasPayment,
    creditCard: AsaasCreditCard,
    creditCardHolderInfo: AsaasCreditCardHolderInfo
  ): Promise<AsaasPayment & { id: string; status: string }> {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify({
        ...payment,
        creditCard,
        creditCardHolderInfo,
      }),
    })
  }

  async getPayment(id: string): Promise<AsaasPayment & {
    id: string
    status: string
    invoiceUrl: string
    bankSlipUrl?: string
    pixTransaction?: { qrCodeImage: string; payload: string }
  }> {
    return this.request(`/payments/${id}`)
  }

  async getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
    return this.request(`/payments/${paymentId}/pixQrCode`)
  }

  async getPaymentsByCustomer(customerId: string): Promise<{ data: Array<AsaasPayment & { id: string; status: string }> }> {
    return this.request(`/payments?customer=${customerId}`)
  }

  async deletePayment(id: string): Promise<{ deleted: boolean }> {
    return this.request(`/payments/${id}`, {
      method: 'DELETE',
    })
  }

  async refundPayment(id: string, value?: number): Promise<AsaasPayment & { id: string }> {
    return this.request(`/payments/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify(value ? { value } : {}),
    })
  }

  // ==================== SUBSCRIPTIONS ====================

  async createSubscription(subscription: AsaasSubscription): Promise<AsaasSubscription & { id: string }> {
    return this.request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscription),
    })
  }

  async createSubscriptionWithCreditCard(
    subscription: AsaasSubscription,
    creditCard: AsaasCreditCard,
    creditCardHolderInfo: AsaasCreditCardHolderInfo
  ): Promise<AsaasSubscription & { id: string }> {
    return this.request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        ...subscription,
        creditCard,
        creditCardHolderInfo,
      }),
    })
  }

  async getSubscription(id: string): Promise<AsaasSubscription & { id: string; status: string }> {
    return this.request(`/subscriptions/${id}`)
  }

  async getSubscriptionsByCustomer(customerId: string): Promise<{ data: Array<AsaasSubscription & { id: string; status: string }> }> {
    return this.request(`/subscriptions?customer=${customerId}`)
  }

  async updateSubscription(id: string, data: Partial<AsaasSubscription>): Promise<AsaasSubscription & { id: string }> {
    return this.request(`/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSubscription(id: string): Promise<{ deleted: boolean }> {
    return this.request(`/subscriptions/${id}`, {
      method: 'DELETE',
    })
  }

  async getSubscriptionPayments(subscriptionId: string): Promise<{ data: Array<AsaasPayment & { id: string; status: string }> }> {
    return this.request(`/subscriptions/${subscriptionId}/payments`)
  }

  // ==================== HELPERS ====================

  getCycleFromPeriod(period: string): 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY' {
    const cycles: Record<string, 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'> = {
      'MONTHLY': 'MONTHLY',
      'MENSAL': 'MONTHLY',
      'QUARTERLY': 'QUARTERLY',
      'TRIMESTRAL': 'QUARTERLY',
      'SEMIANNUALLY': 'SEMIANNUALLY',
      'SEMESTRAL': 'SEMIANNUALLY',
      'YEARLY': 'YEARLY',
      'ANUAL': 'YEARLY',
    }
    return cycles[period.toUpperCase()] || 'MONTHLY'
  }

  formatCpfCnpj(value: string): string {
    return value.replace(/\D/g, '')
  }
}

export const asaas = new AsaasClient()

export type {
  AsaasCustomer,
  AsaasPayment,
  AsaasSubscription,
  AsaasCreditCard,
  AsaasCreditCardHolderInfo,
  AsaasPixQrCode,
}
