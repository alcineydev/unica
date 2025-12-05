/**
 * Tipos globais do sistema Unica
 */

// Roles do sistema
export type Role = 'DEVELOPER' | 'ADMIN' | 'PARCEIRO' | 'ASSINANTE'

// Status de assinatura
export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED'

// Tipos de benefício
export type BenefitType = 'DESCONTO' | 'CASHBACK' | 'PONTOS' | 'ACESSO_EXCLUSIVO'

// Tipos de transação
export type TransactionType = 'PURCHASE' | 'CASHBACK' | 'BONUS' | 'MONTHLY_POINTS' | 'REFUND'

// Status de transação
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

// Categorias de configuração
export type ConfigCategory = 'PAYMENT' | 'INTEGRATION' | 'BUSINESS' | 'SYSTEM'

// Tipos de integração
export type IntegrationType = 'EVOLUTION_API' | 'EMAIL' | 'SMS' | 'PAYMENT'

// Interface base para respostas de API
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Interface para paginação
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Interface para filtros de listagem
export interface ListFilters {
  page?: number
  limit?: number
  search?: string
  orderBy?: string
  order?: 'asc' | 'desc'
}

// Interface para endereço
export interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  coordinates?: {
    lat: number
    lng: number
  }
}

// Interface para contato
export interface Contact {
  whatsapp: string
  phone?: string
  email?: string
}

// Interface para horário de funcionamento
export interface BusinessHours {
  day: number // 0-6 (domingo-sábado)
  dayName: string
  open: string // "08:00"
  close: string // "18:00"
  isClosed: boolean
}

// Interface para métricas do parceiro
export interface PartnerMetrics {
  pageViews: number
  whatsappClicks: number
  totalSales: number
  salesAmount: number
}

// Interface para configuração de benefício
export interface BenefitConfig {
  percentage?: number
  fixedValue?: number
  monthlyPoints?: number
  categoryDiscount?: Record<string, number>
  partnerIds?: string[]
}

// Interface para sessão do usuário
export interface UserSession {
  id: string
  email: string
  role: Role
  name: string
  isActive: boolean
}
