import prisma from '@/lib/prisma'
import { headers } from 'next/headers'

export type LogType = 'AUTH' | 'ADMIN' | 'USER' | 'PARTNER' | 'SUBSCRIBER' | 'CONFIG' | 'ERROR' | 'SYSTEM'

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
  type: LogType
  action: LogAction
  message: string
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

    await prisma.systemLog.create({
      data: {
        type: params.type,
        action: params.action,
        message: params.message,
        details: params.details ? JSON.stringify(params.details) : null,
        userId: params.userId || null,
        targetId: params.targetId || null,
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
      type: 'AUTH',
      action: 'LOGIN',
      message: `Login realizado: ${email}`,
      userId,
      details: { email }
    }),

  loginFailed: (email: string, reason: string) =>
    createLog({
      type: 'AUTH',
      action: 'LOGIN_FAILED',
      message: `Tentativa de login falhou: ${email}`,
      details: { email, reason }
    }),

  logout: (userId: string, email: string) =>
    createLog({
      type: 'AUTH',
      action: 'LOGOUT',
      message: `Logout realizado: ${email}`,
      userId,
      details: { email }
    }),

  // Admin
  adminCreated: (userId: string, adminId: string, adminEmail: string) =>
    createLog({
      type: 'ADMIN',
      action: 'CREATE',
      message: `Admin criado: ${adminEmail}`,
      userId,
      targetId: adminId,
      details: { adminEmail }
    }),

  adminUpdated: (userId: string, adminId: string, adminEmail: string, changes: string[]) =>
    createLog({
      type: 'ADMIN',
      action: 'UPDATE',
      message: `Admin atualizado: ${adminEmail}`,
      userId,
      targetId: adminId,
      details: { adminEmail, changes }
    }),

  adminDeleted: (userId: string, adminEmail: string) =>
    createLog({
      type: 'ADMIN',
      action: 'DELETE',
      message: `Admin excluído: ${adminEmail}`,
      userId,
      details: { adminEmail }
    }),

  adminActivated: (userId: string, adminId: string, adminEmail: string) =>
    createLog({
      type: 'ADMIN',
      action: 'ACTIVATE',
      message: `Admin ativado: ${adminEmail}`,
      userId,
      targetId: adminId,
      details: { adminEmail }
    }),

  adminDeactivated: (userId: string, adminId: string, adminEmail: string) =>
    createLog({
      type: 'ADMIN',
      action: 'DEACTIVATE',
      message: `Admin desativado: ${adminEmail}`,
      userId,
      targetId: adminId,
      details: { adminEmail }
    }),

  // Password
  passwordChanged: (userId: string, targetId: string, email: string) =>
    createLog({
      type: 'AUTH',
      action: 'PASSWORD_CHANGE',
      message: `Senha alterada: ${email}`,
      userId,
      targetId,
      details: { email }
    }),

  passwordReset: (email: string) =>
    createLog({
      type: 'AUTH',
      action: 'PASSWORD_RESET',
      message: `Senha redefinida: ${email}`,
      details: { email }
    }),

  // Email
  emailChangeRequested: (userId: string, oldEmail: string, newEmail: string) =>
    createLog({
      type: 'AUTH',
      action: 'EMAIL_CHANGE',
      message: `Mudança de email solicitada: ${oldEmail} → ${newEmail}`,
      userId,
      details: { oldEmail, newEmail }
    }),

  emailChangeConfirmed: (userId: string, oldEmail: string, newEmail: string) =>
    createLog({
      type: 'AUTH',
      action: 'EMAIL_CHANGE_CONFIRM',
      message: `Email alterado: ${oldEmail} → ${newEmail}`,
      userId,
      details: { oldEmail, newEmail }
    }),

  // Config
  configUpdated: (userId: string, configKey: string) =>
    createLog({
      type: 'CONFIG',
      action: 'CONFIG_UPDATE',
      message: `Configuração atualizada: ${configKey}`,
      userId,
      details: { configKey }
    }),

  // Error (salva no banco)
  logError: (message: string, error: unknown, userId?: string) =>
    createLog({
      type: 'ERROR',
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
      type: 'SYSTEM',
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
