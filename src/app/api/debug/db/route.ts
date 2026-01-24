import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Pega a URL do banco (mascarando a senha)
    const dbUrl = process.env.PRISMA_DB_URL || process.env.DATABASE_URL || 'NOT_SET'
    const maskedUrl = dbUrl.replace(/:[^@]+@/, ':****@')
    
    // Conta os planos para verificar qual banco está conectado
    const planCount = await prisma.plan.count()
    const plans = await prisma.plan.findMany({
      select: { id: true, name: true, slug: true },
      take: 10
    })
    
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      dbUrl: maskedUrl,
      planCount,
      plans: plans.map(p => p.name),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

