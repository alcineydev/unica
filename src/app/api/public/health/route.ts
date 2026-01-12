import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    database: false,
    userCount: 0,
    error: null as string | null,
  }

  try {
    // Testar conexão com banco
    await prisma.$queryRaw`SELECT 1`
    checks.database = true

    // Contar usuários para verificar se dados existem
    checks.userCount = await prisma.user.count()
  } catch (error) {
    checks.database = false
    checks.error = error instanceof Error ? error.message : 'Unknown error'
  }

  return NextResponse.json(checks, {
    status: checks.database ? 200 : 500,
  })
}
