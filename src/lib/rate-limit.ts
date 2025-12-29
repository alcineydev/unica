import { NextResponse } from 'next/server'

// Store simples em memória (para produção considerar Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number  // Janela de tempo em ms
  maxRequests: number  // Máximo de requisições na janela
}

export function rateLimit(config: RateLimitConfig = { windowMs: 60000, maxRequests: 10 }) {
  return async function checkRateLimit(identifier: string): Promise<{ success: boolean; remaining: number }> {
    const now = Date.now()
    const key = identifier

    const record = rateLimitStore.get(key)

    if (!record || now > record.resetTime) {
      // Nova janela
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return { success: true, remaining: config.maxRequests - 1 }
    }

    if (record.count >= config.maxRequests) {
      return { success: false, remaining: 0 }
    }

    record.count++
    return { success: true, remaining: config.maxRequests - record.count }
  }
}

// Configurações pré-definidas
export const loginRateLimit = rateLimit({ windowMs: 60000, maxRequests: 5 }) // 5 tentativas/minuto
export const registerRateLimit = rateLimit({ windowMs: 60000, maxRequests: 3 }) // 3 cadastros/minuto
export const apiRateLimit = rateLimit({ windowMs: 60000, maxRequests: 60 }) // 60 req/minuto geral

// Helper para extrair IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return ip
}

// Helper para resposta de rate limit
export function rateLimitResponse() {
  return NextResponse.json(
    { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
    {
      status: 429,
      headers: {
        'Retry-After': '60'
      }
    }
  )
}
