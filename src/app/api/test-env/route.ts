import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    // Variáveis do Prisma/Supabase
    hasPostgresPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
    postgresUrlStart: process.env.POSTGRES_PRISMA_URL?.substring(0, 40) || 'não definida',
    hasPostgresUrlNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
    
    // Variáveis de Auth
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    
    // Ambiente
    nodeEnv: process.env.NODE_ENV,
    
    // Todas as variáveis relevantes
    allEnvKeys: Object.keys(process.env).filter(k => 
      k.includes('POSTGRES') || 
      k.includes('DATABASE') || 
      k.includes('AUTH') || 
      k.includes('SUPABASE')
    ).sort()
  })
}
