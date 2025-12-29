const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log('[LOG]', ...args)
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info('[INFO]', ...args)
  },
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args) // Warnings sempre aparecem
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args) // Erros sempre aparecem
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug('[DEBUG]', ...args)
  }
}
