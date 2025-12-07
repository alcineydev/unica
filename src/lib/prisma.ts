import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Singleton para o Prisma Client no Next.js
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function createPrismaClient() {
  // Verifica se há uma DATABASE_URL configurada
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.warn('DATABASE_URL não configurada. Usando Prisma sem conexão.')
    // Retorna um Prisma Client básico (vai falhar ao tentar queries reais)
    return new PrismaClient()
  }

  // Cria o pool de conexões
  const pool = new Pool({ connectionString })
  globalForPrisma.pool = pool

  // Cria o adapter
  const adapter = new PrismaPg(pool)

  // Cria e retorna o Prisma Client com o adapter
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

// Cleanup para encerrar o pool quando necessário
export async function disconnectPrisma() {
  await prisma.$disconnect()
  if (globalForPrisma.pool) {
    await globalForPrisma.pool.end()
  }
}
