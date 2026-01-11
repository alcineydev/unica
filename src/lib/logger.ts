import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { headers } from 'next/headers'

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

export type LogAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'PASSWORD_CHANGE'
  | 'EMAIL_CHANGE'
  | 'EMAIL_CHANGE_CONFIRM'
  | 'PASSWORD_RESET'
  | 'CONFIG_UPDATE'
  | 'ERROR'

interface LogParams {
  level?: LogLevel
  action: LogAction
  message?: string
  details?: Record<string, unknown>
  userId?: string | null
  targetId?: string | null
}

export async function createLog(params: LogParams) {
  try {
    let ip: string | null = null
    let userAgent: string | null = null

    // Tentar pegar headers (só funciona em server components/route handlers)
    try {
      const headersList = await headers()
      ip = headersList.get('x-forwarded-for')?.split(',')[0] ||
           headersList.get('x-real-ip') ||
           null
      userAgent = headersList.get('user-agent') || null
    } catch {
      // Headers não disponíveis (ex: chamada de background)
    }

    // Monta o objeto details incluindo message e targetId se existirem
    const detailsObj: Record<string, unknown> = {
      ...params.details,
    }
    if (params.message) {
      detailsObj.message = params.message
    }
    if (params.targetId) {
      detailsObj.targetId = params.targetId
    }

    await prisma.systemLog.create({
      data: {
        level: params.level || 'INFO',
        action: params.action,
        details: Object.keys(detailsObj).length > 0 ? (detailsObj as Prisma.JsonObject) : undefined,
        userId: params.userId || undefined,
        ip,
        userAgent: userAgent?.substring(0, 500), // Limitar tamanho
      },
    })
  } catch (error) {
    // Não quebrar a aplicação se o log falhar
    console.error('[LOGGER] Erro ao criar log:', error)
  }
}

// Funções helper para tipos comuns de log
export const logger = {
  // Auth
  login: (userId: string, email: string) =>
    createLog({
      level: 'INFO',
      action: 'LOGIN',
      message: `Login realizado: ${email}`,
      userId,
      details: { email }
    }),

  loginFailed: (email: string, reason: string) =>
    createLog({
      level: 'WARN',
      action: 'LOGIN_FAILED',
      message: `Tentativa de login falhou: ${email}`,
      details: { email, reason }
    }),

  logout: (userId: string, email: string) =>
    createLog({
      level: 'INFO',
      action: 'LOGOUT',
      message: `Logout realizado: ${email}`,
      userId,
      details: { email }
    }),

  // Admin
  adminCreated: (userId: string, adminId: string, adminEmail: string) =>
    createLog({
      level: 'INFO',
      action: 'CREATE',
      message: `Admin criado: ${adminEmail}`,
      userId,
      targetId: adminId,
      details: { adminEmail }
    }),

  adminUpdated: (userId: string, adminId: string, adminEmail: string, changes: string[]) =>
    createLog({
      level: 'INFO',
      action: 'UPDATE',
      message: `Admin atualizado: ${adminEmail}`,
      userId,
      targetId: adminId,
      details: { adminEmail, changes }
    }),

  adminDeleted: (userId: string, adminEmail: string) =>
    createLog({
      level: 'INFO',
      action: 'DELETE',
      message: `Admin excluído: ${adminEmail}`,
      userId,
      details: { adminEmail }
    }),

  adminActivated: (userId: string, adminId: string, adminEmail: string) =>
    createLog({
      level: 'INFO',
      action: 'ACTIVATE',
      message: `Admin ativado: ${adminEmail}`,
      userId,
      targetId: adminId,
      details: { adminEmail }
    }),

  adminDeactivated: (userId: string, adminId: string, adminEmail: string) =>
    createLog({
      level: 'INFO',
      action: 'DEACTIVATE',
      message: `Admin desativado: ${adminEmail}`,
      userId,
      targetId: adminId,
      details: { adminEmail }
    }),

  // Password
  passwordChanged: (userId: string, targetId: string, email: string) =>
    createLog({
      level: 'INFO',
      action: 'PASSWORD_CHANGE',
      message: `Senha alterada: ${email}`,
      userId,
      targetId,
      details: { email }
    }),

  passwordReset: (email: string) =>
    createLog({
      level: 'INFO',
      action: 'PASSWORD_RESET',
      message: `Senha redefinida: ${email}`,
      details: { email }
    }),

  // Email
  emailChangeRequested: (userId: string, oldEmail: string, newEmail: string) =>
    createLog({
      level: 'INFO',
      action: 'EMAIL_CHANGE',
      message: `Mudança de email solicitada: ${oldEmail} → ${newEmail}`,
      userId,
      details: { oldEmail, newEmail }
    }),

  emailChangeConfirmed: (userId: string, oldEmail: string, newEmail: string) =>
    createLog({
      level: 'INFO',
      action: 'EMAIL_CHANGE_CONFIRM',
      message: `Email alterado: ${oldEmail} → ${newEmail}`,
      userId,
      details: { oldEmail, newEmail }
    }),

  // Config
  configUpdated: (userId: string, configKey: string) =>
    createLog({
      level: 'INFO',
      action: 'CONFIG_UPDATE',
      message: `Configuração atualizada: ${configKey}`,
      userId,
      details: { configKey }
    }),

  // Benefícios
  benefitCreated: (userId: string, benefitId: string, benefitName: string) =>
    createLog({
      level: 'INFO',
      action: 'CREATE',
      message: `Benefício criado: ${benefitName}`,
      userId,
      targetId: benefitId,
      details: { benefitName }
    }),

  benefitUpdated: (userId: string, benefitId: string, benefitName: string) =>
    createLog({
      level: 'INFO',
      action: 'UPDATE',
      message: `Benefício atualizado: ${benefitName}`,
      userId,
      targetId: benefitId,
      details: { benefitName }
    }),

  benefitDeleted: (userId: string, benefitName: string) =>
    createLog({
      level: 'INFO',
      action: 'DELETE',
      message: `Benefício excluído: ${benefitName}`,
      userId,
      details: { benefitName }
    }),

  // Planos
  planCreated: (userId: string, planId: string, planName: string) =>
    createLog({
      level: 'INFO',
      action: 'CREATE',
      message: `Plano criado: ${planName}`,
      userId,
      targetId: planId,
      details: { planName }
    }),

  planUpdated: (userId: string, planId: string, planName: string) =>
    createLog({
      level: 'INFO',
      action: 'UPDATE',
      message: `Plano atualizado: ${planName}`,
      userId,
      targetId: planId,
      details: { planName }
    }),

  planDeleted: (userId: string, planName: string) =>
    createLog({
      level: 'INFO',
      action: 'DELETE',
      message: `Plano excluído: ${planName}`,
      userId,
      details: { planName }
    }),

  // Parceiros
  partnerCreated: (userId: string, partnerId: string, partnerName: string) =>
    createLog({
      level: 'INFO',
      action: 'CREATE',
      message: `Parceiro criado: ${partnerName}`,
      userId,
      targetId: partnerId,
      details: { partnerName }
    }),

  partnerUpdated: (userId: string, partnerId: string, partnerName: string) =>
    createLog({
      level: 'INFO',
      action: 'UPDATE',
      message: `Parceiro atualizado: ${partnerName}`,
      userId,
      targetId: partnerId,
      details: { partnerName }
    }),

  partnerDeleted: (userId: string, partnerName: string) =>
    createLog({
      level: 'INFO',
      action: 'DELETE',
      message: `Parceiro excluído: ${partnerName}`,
      userId,
      details: { partnerName }
    }),

  partnerActivated: (userId: string, partnerId: string, partnerName: string) =>
    createLog({
      level: 'INFO',
      action: 'ACTIVATE',
      message: `Parceiro ativado: ${partnerName}`,
      userId,
      targetId: partnerId,
      details: { partnerName }
    }),

  partnerDeactivated: (userId: string, partnerId: string, partnerName: string) =>
    createLog({
      level: 'INFO',
      action: 'DEACTIVATE',
      message: `Parceiro desativado: ${partnerName}`,
      userId,
      targetId: partnerId,
      details: { partnerName }
    }),

  // Assinantes
  subscriberCreated: (userId: string, subscriberId: string, subscriberName: string) =>
    createLog({
      level: 'INFO',
      action: 'CREATE',
      message: `Assinante criado: ${subscriberName}`,
      userId,
      targetId: subscriberId,
      details: { subscriberName }
    }),

  subscriberUpdated: (userId: string, subscriberId: string, subscriberName: string) =>
    createLog({
      level: 'INFO',
      action: 'UPDATE',
      message: `Assinante atualizado: ${subscriberName}`,
      userId,
      targetId: subscriberId,
      details: { subscriberName }
    }),

  subscriberDeleted: (userId: string, subscriberName: string) =>
    createLog({
      level: 'INFO',
      action: 'DELETE',
      message: `Assinante excluído: ${subscriberName}`,
      userId,
      details: { subscriberName }
    }),

  // Categorias
  categoryCreated: (userId: string, categoryId: string, categoryName: string) =>
    createLog({
      level: 'INFO',
      action: 'CREATE',
      message: `Categoria criada: ${categoryName}`,
      userId,
      targetId: categoryId,
      details: { categoryName }
    }),

  categoryUpdated: (userId: string, categoryId: string, categoryName: string) =>
    createLog({
      level: 'INFO',
      action: 'UPDATE',
      message: `Categoria atualizada: ${categoryName}`,
      userId,
      targetId: categoryId,
      details: { categoryName }
    }),

  categoryDeleted: (userId: string, categoryName: string) =>
    createLog({
      level: 'INFO',
      action: 'DELETE',
      message: `Categoria excluída: ${categoryName}`,
      userId,
      details: { categoryName }
    }),

  // Cidades
  cityCreated: (userId: string, cityId: string, cityName: string) =>
    createLog({
      level: 'INFO',
      action: 'CREATE',
      message: `Cidade criada: ${cityName}`,
      userId,
      targetId: cityId,
      details: { cityName }
    }),

  cityUpdated: (userId: string, cityId: string, cityName: string) =>
    createLog({
      level: 'INFO',
      action: 'UPDATE',
      message: `Cidade atualizada: ${cityName}`,
      userId,
      targetId: cityId,
      details: { cityName }
    }),

  cityDeleted: (userId: string, cityName: string) =>
    createLog({
      level: 'INFO',
      action: 'DELETE',
      message: `Cidade excluída: ${cityName}`,
      userId,
      details: { cityName }
    }),

  // Notificações
  notificationSent: (userId: string, notificationId: string, title: string, targetType: string) =>
    createLog({
      level: 'INFO',
      action: 'CREATE',
      message: `Notificação enviada: ${title} para ${targetType}`,
      userId,
      targetId: notificationId,
      details: { title, targetType }
    }),

  // Error (salva no banco)
  logError: (message: string, error: unknown, userId?: string) =>
    createLog({
      level: 'ERROR',
      action: 'ERROR',
      message,
      userId,
      details: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    }),

  // System
  system: (message: string, details?: Record<string, unknown>) =>
    createLog({
      level: 'INFO',
      action: 'UPDATE',
      message,
      details
    }),

  // Métodos de console (não salvam no banco)
  log: (...args: unknown[]) => {
    console.log(...args)
  },

  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', ...args)
    }
  },

  info: (...args: unknown[]) => {
    console.info('[INFO]', ...args)
  },

  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args)
  },

  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args)
  },
}
