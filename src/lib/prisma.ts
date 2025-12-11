import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    // Durante o build, retorna um client dummy que será substituído em runtime
    console.warn('DATABASE_URL não disponível - isso é esperado durante o build')
    return new PrismaClient()
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    },
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
