// ==========================================
// TIPOS DO ASAAS
// ==========================================

// Ambiente
export type AsaasEnvironment = 'sandbox' | 'production'

// Forma de pagamento
export type AsaasBillingType = 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED'

// Status do pagamento
export type AsaasPaymentStatus = 
  | 'PENDING'           // Aguardando pagamento
  | 'RECEIVED'          // Recebido (saldo disponível)
  | 'CONFIRMED'         // Confirmado (saldo ainda não disponível)
  | 'OVERDUE'           // Vencido
  | 'REFUNDED'          // Estornado
  | 'RECEIVED_IN_CASH'  // Recebido em dinheiro
  | 'REFUND_REQUESTED'  // Estorno solicitado
  | 'REFUND_IN_PROGRESS'// Estorno em processamento
  | 'CHARGEBACK_REQUESTED' // Chargeback solicitado
  | 'CHARGEBACK_DISPUTE'   // Em disputa de chargeback
  | 'AWAITING_CHARGEBACK_REVERSAL' // Aguardando reversão de chargeback
  | 'DUNNING_REQUESTED' // Negativação solicitada
  | 'DUNNING_RECEIVED'  // Negativação recebida
  | 'AWAITING_RISK_ANALYSIS' // Aguardando análise de risco

// Status da assinatura
export type AsaasSubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED'

// Ciclo da assinatura
export type AsaasSubscriptionCycle = 
  | 'WEEKLY'      // Semanal
  | 'BIWEEKLY'    // Quinzenal
  | 'MONTHLY'     // Mensal
  | 'BIMONTHLY'   // Bimestral
  | 'QUARTERLY'   // Trimestral
  | 'SEMIANNUALLY'// Semestral
  | 'YEARLY'      // Anual

// ==========================================
// CLIENTE
// ==========================================

export interface AsaasCustomer {
  id?: string
  name: string
  email: string
  cpfCnpj: string
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string // Bairro
  postalCode?: string
  city?: string
  state?: string
  country?: string
  externalReference?: string
  notificationDisabled?: boolean
  observations?: string
}

export interface AsaasCustomerResponse {
  id: string
  dateCreated: string
  name: string
  email: string
  cpfCnpj: string
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  postalCode?: string
  city?: string
  state?: string
  country?: string
  externalReference?: string
  notificationDisabled: boolean
  deleted: boolean
}

// ==========================================
// COBRANÇA
// ==========================================

export interface AsaasPaymentCreate {
  customer: string // ID do cliente
  billingType: AsaasBillingType
  value: number
  dueDate: string // YYYY-MM-DD
  description?: string
  externalReference?: string
  installmentCount?: number // Parcelas (cartão)
  installmentValue?: number
  discount?: {
    value: number
    dueDateLimitDays: number
    type: 'FIXED' | 'PERCENTAGE'
  }
  interest?: {
    value: number // % ao mês
  }
  fine?: {
    value: number // %
    type: 'FIXED' | 'PERCENTAGE'
  }
  postalService?: boolean // Enviar boleto pelos Correios
  // Cartão de crédito
  creditCard?: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  creditCardHolderInfo?: {
    name: string
    email: string
    cpfCnpj: string
    postalCode: string
    addressNumber: string
    phone: string
  }
  creditCardToken?: string // Token do cartão (recomendado)
  remoteIp?: string
}

export interface AsaasPaymentResponse {
  id: string
  dateCreated: string
  customer: string
  paymentLink?: string
  dueDate: string
  value: number
  netValue: number
  billingType: AsaasBillingType
  status: AsaasPaymentStatus
  description?: string
  externalReference?: string
  confirmedDate?: string
  originalValue?: number
  interestValue?: number
  originalDueDate?: string
  paymentDate?: string
  clientPaymentDate?: string
  invoiceUrl?: string
  bankSlipUrl?: string
  transactionReceiptUrl?: string
  invoiceNumber?: string
  deleted: boolean
  anticipated: boolean
  creditCard?: {
    creditCardNumber: string
    creditCardBrand: string
    creditCardToken: string
  }
}

// ==========================================
// PIX
// ==========================================

export interface AsaasPixQrCode {
  encodedImage: string // Base64 do QR Code
  payload: string // Código copia e cola
  expirationDate: string
}

// ==========================================
// ASSINATURA
// ==========================================

export interface AsaasSubscriptionCreate {
  customer: string
  billingType: AsaasBillingType
  value: number
  nextDueDate: string // YYYY-MM-DD
  cycle: AsaasSubscriptionCycle
  description?: string
  externalReference?: string
  creditCard?: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  creditCardHolderInfo?: {
    name: string
    email: string
    cpfCnpj: string
    postalCode: string
    addressNumber: string
    phone: string
  }
  creditCardToken?: string
  remoteIp?: string
}

export interface AsaasSubscriptionResponse {
  id: string
  dateCreated: string
  customer: string
  paymentLink?: string
  billingType: AsaasBillingType
  value: number
  nextDueDate: string
  cycle: AsaasSubscriptionCycle
  description?: string
  externalReference?: string
  status: AsaasSubscriptionStatus
  deleted: boolean
  creditCard?: {
    creditCardNumber: string
    creditCardBrand: string
    creditCardToken: string
  }
}

// ==========================================
// TOKENIZAÇÃO DE CARTÃO
// ==========================================

export interface AsaasCreditCardTokenize {
  customer: string
  creditCard: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  creditCardHolderInfo: {
    name: string
    email: string
    cpfCnpj: string
    postalCode: string
    addressNumber: string
    phone: string
  }
  remoteIp: string
}

export interface AsaasCreditCardTokenResponse {
  creditCardNumber: string
  creditCardBrand: string
  creditCardToken: string
}

// ==========================================
// WEBHOOK
// ==========================================

export interface AsaasWebhookPayload {
  event: string
  payment?: AsaasPaymentResponse
  subscription?: AsaasSubscriptionResponse
}

// ==========================================
// ERROS
// ==========================================

export interface AsaasError {
  errors: Array<{
    code: string
    description: string
  }>
}

// ==========================================
// LISTA PAGINADA
// ==========================================

export interface AsaasPaginatedResponse<T> {
  object: string
  hasMore: boolean
  totalCount: number
  limit: number
  offset: number
  data: T[]
}

