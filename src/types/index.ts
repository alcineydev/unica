/**
 * Tipos globais do sistema Unica
 */

import type {
  User,
  Plan,
  Benefit,
  Parceiro,
  Assinante,
  City,
  Category,
  Transaction,
  PlanBenefit,
  BenefitAccess
} from '@prisma/client'

// ============================================
// Enums / Tipos Base
// ============================================

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

// ============================================
// API Responses
// ============================================

// Interface base para respostas de API
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiErrorResponse {
  error: string
  details?: Record<string, string[]>
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

// ============================================
// Models with Relations
// ============================================

export interface UserWithRelations extends User {
  assinante?: Assinante | null
  parceiro?: Parceiro | null
  admin?: { id: string; name: string; phone: string } | null
}

export interface ParceiroWithRelations extends Parceiro {
  user: User
  categoryRef?: Category | null
  city: City
  benefitAccess?: BenefitAccess[]
  _count?: {
    transactions: number
    avaliacoes: number
  }
}

export interface AssinanteWithRelations extends Assinante {
  user: User
  plan?: Plan | null
  city?: City | null
  _count?: {
    transactions: number
    avaliacoes: number
  }
}

export interface PlanWithBenefits extends Plan {
  planBenefits?: (PlanBenefit & { benefit: Benefit })[]
  _count?: {
    assinantes: number
  }
}

export interface CategoryWithCount extends Category {
  _count?: {
    parceiros: number
  }
}

export interface TransactionWithRelations extends Transaction {
  assinante: Assinante
  parceiro?: Parceiro | null
}

// ============================================
// Form Events
// ============================================

export type InputChangeEvent = React.ChangeEvent<HTMLInputElement>
export type TextAreaChangeEvent = React.ChangeEvent<HTMLTextAreaElement>
export type SelectChangeEvent = React.ChangeEvent<HTMLSelectElement>
export type FormSubmitEvent = React.FormEvent<HTMLFormElement>

// ============================================
// Address & Contact
// ============================================

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
  website?: string
  instagram?: string
  facebook?: string
}

// Interface para horário de funcionamento
export interface BusinessHours {
  day: number // 0-6 (domingo-sábado)
  dayName: string
  open: string // "08:00"
  close: string // "18:00"
  isClosed: boolean
}

// ============================================
// Metrics
// ============================================

// Interface para métricas do parceiro
export interface PartnerMetrics {
  pageViews: number
  whatsappClicks: number
  totalSales: number
  salesAmount: number
}

// Dashboard Stats
export interface DashboardStats {
  totalAssinantes: number
  totalParceiros: number
  totalTransactions: number
  totalRevenue: number
  assinantesAtivos: number
  assinantesPendentes: number
  parceirosAtivos: number
}

// ============================================
// Benefit Config
// ============================================

// Interface para configuração de benefício
export interface BenefitConfig {
  percentage?: number
  fixedValue?: number
  monthlyPoints?: number
  categoryDiscount?: Record<string, number>
  partnerIds?: string[]
}

// ============================================
// Session
// ============================================

// Interface para sessão do usuário
export interface UserSession {
  id: string
  email: string
  role: Role
  name: string
  isActive: boolean
  avatar?: string | null
}

// ============================================
// Push Notifications
// ============================================

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  userAgent?: string
  platform?: string
  deviceInfo?: string
}

export interface PushPayload {
  title: string
  message: string
  icon?: string
  badge?: string
  link?: string
  tag?: string
}

// ============================================
// Cloudinary
// ============================================

export interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
  width: number
  height: number
  format: string
  bytes: number
}

// ============================================
// Error Types
// ============================================

export interface AppError extends Error {
  code?: string
  statusCode?: number
  details?: Record<string, unknown>
}
