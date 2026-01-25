import prisma from '@/lib/prisma'
import {
  AsaasCustomer,
  AsaasCustomerResponse,
  AsaasPaymentCreate,
  AsaasPaymentResponse,
  AsaasPixQrCode,
  AsaasSubscriptionCreate,
  AsaasSubscriptionResponse,
  AsaasCreditCardTokenize,
  AsaasCreditCardTokenResponse,
  AsaasPaginatedResponse,
  AsaasError,
} from '@/types/asaas'

// ==========================================
// CONFIGURAÇÃO
// ==========================================

interface AsaasConfig {
  apiKey: string
  baseUrl: string
  environment: 'sandbox' | 'production'
  webhookToken: string
}

async function getAsaasConfig(): Promise<AsaasConfig> {
  const configs = await prisma.config.findMany({
    where: { key: { startsWith: 'asaas_' } }
  })

  const configMap: Record<string, string> = {}
  configs.forEach(config => {
    configMap[config.key] = config.value
  })

  const environment = (configMap['asaas_environment'] || 'sandbox') as 'sandbox' | 'production'
  const apiKey = configMap['asaas_api_key'] || ''
  const webhookToken = configMap['asaas_webhook_token'] || ''

  const baseUrl = environment === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3'

  return { apiKey, baseUrl, environment, webhookToken }
}

// ==========================================
// CLIENTE HTTP
// ==========================================

async function asaasRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = await getAsaasConfig()

  if (!config.apiKey) {
    throw new Error('API Key do Asaas não configurada')
  }

  const url = `${config.baseUrl}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'access_token': config.apiKey,
      'User-Agent': 'UNICA-App',
      ...options.headers
    }
  })

  const data = await response.json()

  if (!response.ok) {
    const error = data as AsaasError
    const errorMessage = error.errors?.[0]?.description || 'Erro na API do Asaas'
    console.error('[ASAAS] Erro:', errorMessage, data)
    throw new Error(errorMessage)
  }

  return data as T
}

// ==========================================
// CLIENTES
// ==========================================

/**
 * Criar um novo cliente no Asaas
 */
export async function createCustomer(customer: AsaasCustomer): Promise<AsaasCustomerResponse> {
  console.log('[ASAAS] Criando cliente:', customer.email)
  
  return asaasRequest<AsaasCustomerResponse>('/customers', {
    method: 'POST',
    body: JSON.stringify(customer)
  })
}

/**
 * Buscar cliente por CPF/CNPJ
 */
export async function findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomerResponse | null> {
  console.log('[ASAAS] Buscando cliente por CPF/CNPJ:', cpfCnpj)
  
  const cleanDoc = cpfCnpj.replace(/\D/g, '')
  
  const response = await asaasRequest<AsaasPaginatedResponse<AsaasCustomerResponse>>(
    `/customers?cpfCnpj=${cleanDoc}`
  )

  return response.data?.[0] || null
}

/**
 * Buscar cliente por ID
 */
export async function findCustomerById(customerId: string): Promise<AsaasCustomerResponse> {
  console.log('[ASAAS] Buscando cliente por ID:', customerId)
  
  return asaasRequest<AsaasCustomerResponse>(`/customers/${customerId}`)
}

/**
 * Buscar ou criar cliente
 */
export async function findOrCreateCustomer(customer: AsaasCustomer): Promise<AsaasCustomerResponse> {
  // Tentar encontrar pelo CPF/CNPJ
  const existing = await findCustomerByCpfCnpj(customer.cpfCnpj)
  
  if (existing) {
    console.log('[ASAAS] Cliente encontrado:', existing.id)
    return existing
  }

  // Criar novo
  return createCustomer(customer)
}

// ==========================================
// COBRANÇAS
// ==========================================

/**
 * Criar uma cobrança
 */
export async function createPayment(payment: AsaasPaymentCreate): Promise<AsaasPaymentResponse> {
  console.log('[ASAAS] Criando cobrança:', payment.billingType, payment.value)
  
  return asaasRequest<AsaasPaymentResponse>('/payments', {
    method: 'POST',
    body: JSON.stringify(payment)
  })
}

/**
 * Buscar cobrança por ID
 */
export async function findPaymentById(paymentId: string): Promise<AsaasPaymentResponse> {
  console.log('[ASAAS] Buscando cobrança:', paymentId)
  
  return asaasRequest<AsaasPaymentResponse>(`/payments/${paymentId}`)
}

/**
 * Buscar cobranças de um cliente
 */
export async function findPaymentsByCustomer(customerId: string): Promise<AsaasPaymentResponse[]> {
  console.log('[ASAAS] Buscando cobranças do cliente:', customerId)
  
  const response = await asaasRequest<AsaasPaginatedResponse<AsaasPaymentResponse>>(
    `/payments?customer=${customerId}`
  )

  return response.data || []
}

/**
 * Buscar cobrança por referência externa
 */
export async function findPaymentByExternalReference(externalReference: string): Promise<AsaasPaymentResponse | null> {
  console.log('[ASAAS] Buscando cobrança por referência:', externalReference)
  
  const response = await asaasRequest<AsaasPaginatedResponse<AsaasPaymentResponse>>(
    `/payments?externalReference=${externalReference}`
  )

  return response.data?.[0] || null
}

/**
 * Cancelar/deletar uma cobrança
 */
export async function deletePayment(paymentId: string): Promise<{ deleted: boolean }> {
  console.log('[ASAAS] Deletando cobrança:', paymentId)
  
  return asaasRequest<{ deleted: boolean }>(`/payments/${paymentId}`, {
    method: 'DELETE'
  })
}

// ==========================================
// PIX
// ==========================================

/**
 * Obter QR Code PIX de uma cobrança
 */
export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  console.log('[ASAAS] Gerando QR Code PIX:', paymentId)
  
  return asaasRequest<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`)
}

/**
 * Criar cobrança PIX com QR Code
 */
export async function createPixPayment(
  customerId: string,
  value: number,
  description: string,
  externalReference?: string,
  dueDate?: string
): Promise<AsaasPaymentResponse & { pix?: AsaasPixQrCode }> {
  // Data de vencimento padrão: hoje + 1 dia
  const defaultDueDate = new Date()
  defaultDueDate.setDate(defaultDueDate.getDate() + 1)
  
  const payment = await createPayment({
    customer: customerId,
    billingType: 'PIX',
    value,
    dueDate: dueDate || defaultDueDate.toISOString().split('T')[0],
    description,
    externalReference
  })

  // Buscar QR Code
  const pix = await getPixQrCode(payment.id)

  return { ...payment, pix }
}

// ==========================================
// BOLETO
// ==========================================

/**
 * Criar cobrança por Boleto
 */
export async function createBoletoPayment(
  customerId: string,
  value: number,
  description: string,
  dueDate: string,
  externalReference?: string
): Promise<AsaasPaymentResponse> {
  return createPayment({
    customer: customerId,
    billingType: 'BOLETO',
    value,
    dueDate,
    description,
    externalReference
  })
}

// ==========================================
// CARTÃO DE CRÉDITO
// ==========================================

/**
 * Tokenizar cartão de crédito
 */
export async function tokenizeCreditCard(
  data: AsaasCreditCardTokenize
): Promise<AsaasCreditCardTokenResponse> {
  console.log('[ASAAS] Tokenizando cartão para cliente:', data.customer)
  
  return asaasRequest<AsaasCreditCardTokenResponse>('/creditCard/tokenize', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * Criar cobrança com cartão de crédito (usando token)
 */
export async function createCreditCardPayment(
  customerId: string,
  value: number,
  description: string,
  creditCardToken: string,
  installmentCount: number = 1,
  externalReference?: string,
  remoteIp?: string
): Promise<AsaasPaymentResponse> {
  const dueDate = new Date().toISOString().split('T')[0]
  
  return createPayment({
    customer: customerId,
    billingType: 'CREDIT_CARD',
    value,
    dueDate,
    description,
    externalReference,
    creditCardToken,
    installmentCount,
    remoteIp
  })
}

// ==========================================
// ASSINATURAS
// ==========================================

/**
 * Criar assinatura recorrente
 */
export async function createSubscription(
  subscription: AsaasSubscriptionCreate
): Promise<AsaasSubscriptionResponse> {
  console.log('[ASAAS] Criando assinatura:', subscription.value, subscription.cycle)
  
  return asaasRequest<AsaasSubscriptionResponse>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(subscription)
  })
}

/**
 * Buscar assinatura por ID
 */
export async function findSubscriptionById(subscriptionId: string): Promise<AsaasSubscriptionResponse> {
  console.log('[ASAAS] Buscando assinatura:', subscriptionId)
  
  return asaasRequest<AsaasSubscriptionResponse>(`/subscriptions/${subscriptionId}`)
}

/**
 * Buscar assinaturas de um cliente
 */
export async function findSubscriptionsByCustomer(customerId: string): Promise<AsaasSubscriptionResponse[]> {
  console.log('[ASAAS] Buscando assinaturas do cliente:', customerId)
  
  const response = await asaasRequest<AsaasPaginatedResponse<AsaasSubscriptionResponse>>(
    `/subscriptions?customer=${customerId}`
  )

  return response.data || []
}

/**
 * Cancelar assinatura
 */
export async function cancelSubscription(subscriptionId: string): Promise<{ deleted: boolean }> {
  console.log('[ASAAS] Cancelando assinatura:', subscriptionId)
  
  return asaasRequest<{ deleted: boolean }>(`/subscriptions/${subscriptionId}`, {
    method: 'DELETE'
  })
}

/**
 * Buscar cobranças de uma assinatura
 */
export async function findPaymentsBySubscription(subscriptionId: string): Promise<AsaasPaymentResponse[]> {
  console.log('[ASAAS] Buscando cobranças da assinatura:', subscriptionId)
  
  const response = await asaasRequest<AsaasPaginatedResponse<AsaasPaymentResponse>>(
    `/subscriptions/${subscriptionId}/payments`
  )

  return response.data || []
}

// ==========================================
// HELPERS
// ==========================================

/**
 * Formatar valor para exibição
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

/**
 * Calcular data de vencimento (X dias a partir de hoje)
 */
export function calculateDueDate(daysFromNow: number = 3): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

/**
 * Validar CPF
 */
export function isValidCpf(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '')
  
  if (cleanCpf.length !== 11) return false
  if (/^(\d)\1+$/.test(cleanCpf)) return false
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf[i]) * (10 - i)
  }
  let digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (digit !== parseInt(cleanCpf[9])) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf[i]) * (11 - i)
  }
  digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (digit !== parseInt(cleanCpf[10])) return false
  
  return true
}

/**
 * Validar CNPJ
 */
export function isValidCnpj(cnpj: string): boolean {
  const cleanCnpj = cnpj.replace(/\D/g, '')
  
  if (cleanCnpj.length !== 14) return false
  if (/^(\d)\1+$/.test(cleanCnpj)) return false
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCnpj[i]) * weights1[i]
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(cleanCnpj[12])) return false
  
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCnpj[i]) * weights2[i]
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(cleanCnpj[13])) return false
  
  return true
}

/**
 * Validar CPF ou CNPJ
 */
export function isValidCpfCnpj(doc: string): boolean {
  const clean = doc.replace(/\D/g, '')
  return clean.length === 11 ? isValidCpf(clean) : isValidCnpj(clean)
}

/**
 * Verificar webhook token
 */
export async function verifyWebhookToken(token: string): Promise<boolean> {
  const config = await getAsaasConfig()
  return config.webhookToken === token
}

/**
 * Obter configuração atual
 */
export async function getConfig(): Promise<AsaasConfig> {
  return getAsaasConfig()
}

// Export default para uso como módulo
const asaas = {
  // Clientes
  createCustomer,
  findCustomerByCpfCnpj,
  findCustomerById,
  findOrCreateCustomer,
  // Cobranças
  createPayment,
  findPaymentById,
  findPaymentsByCustomer,
  findPaymentByExternalReference,
  deletePayment,
  // PIX
  getPixQrCode,
  createPixPayment,
  // Boleto
  createBoletoPayment,
  // Cartão
  tokenizeCreditCard,
  createCreditCardPayment,
  // Assinaturas
  createSubscription,
  findSubscriptionById,
  findSubscriptionsByCustomer,
  cancelSubscription,
  findPaymentsBySubscription,
  // Helpers
  formatCurrency,
  calculateDueDate,
  isValidCpf,
  isValidCnpj,
  isValidCpfCnpj,
  verifyWebhookToken,
  getConfig
}

export default asaas

