import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    status: 'EXECUTANDO',
    checks: {} as Record<string, unknown>
  }

  try {
    // 1. Verificar conexão com banco
    const dbCheck = await checkDatabase()
    diagnostics.checks = { ...diagnostics.checks as object, database: dbCheck }

    // 2. Verificar planos
    const plansCheck = await checkPlans()
    diagnostics.checks = { ...diagnostics.checks as object, plans: plansCheck }

    // 3. Verificar usuários admin
    const usersCheck = await checkUsers()
    diagnostics.checks = { ...diagnostics.checks as object, users: usersCheck }

    // 4. Verificar variáveis de ambiente
    const envCheck = checkEnvironment()
    diagnostics.checks = { ...diagnostics.checks as object, environment: envCheck }

    // 5. Verificar rotas críticas
    const routesCheck = checkRoutes()
    diagnostics.checks = { ...diagnostics.checks as object, routes: routesCheck }

    // Determinar status geral
    const checks = diagnostics.checks as Record<string, { status: string }>
    const hasErrors = Object.values(checks).some(c => c.status === 'ERRO')
    const hasWarnings = Object.values(checks).some(c => c.status === 'AVISO')

    diagnostics.status = hasErrors ? 'ERRO' : hasWarnings ? 'AVISO' : 'OK'

    // Resumo de problemas
    diagnostics.summary = {
      total_checks: Object.keys(checks).length,
      errors: Object.entries(checks).filter(([, v]) => v.status === 'ERRO').map(([k]) => k),
      warnings: Object.entries(checks).filter(([, v]) => v.status === 'AVISO').map(([k]) => k),
      ok: Object.entries(checks).filter(([, v]) => v.status === 'OK').map(([k]) => k)
    }

    return NextResponse.json(diagnostics)

  } catch (error) {
    diagnostics.status = 'ERRO'
    diagnostics.error = String(error)
    return NextResponse.json(diagnostics, { status: 500 })
  }
}

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`
    
    // Contar registros importantes
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.plan.count(),
      prisma.assinante.count(),
      prisma.parceiro.count(),
      prisma.benefit.count()
    ])

    return {
      status: 'OK',
      connected: true,
      counts: {
        users: counts[0],
        plans: counts[1],
        assinantes: counts[2],
        parceiros: counts[3],
        benefits: counts[4]
      }
    }
  } catch (error) {
    return {
      status: 'ERRO',
      connected: false,
      error: String(error)
    }
  }
}

async function checkPlans() {
  try {
    const plans = await prisma.plan.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        price: true,
        _count: {
          select: { planBenefits: true }
        }
      }
    })

    const activePlans = plans.filter(p => p.isActive)
    const inactivePlans = plans.filter(p => !p.isActive)

    if (activePlans.length === 0) {
      return {
        status: 'ERRO',
        message: 'Nenhum plano ativo encontrado!',
        total: plans.length,
        active: 0,
        inactive: inactivePlans.length,
        plans: plans.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          isActive: p.isActive,
          price: Number(p.price),
          benefits: p._count.planBenefits
        }))
      }
    }

    return {
      status: 'OK',
      total: plans.length,
      active: activePlans.length,
      inactive: inactivePlans.length,
      activePlans: activePlans.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        benefits: p._count.planBenefits
      }))
    }
  } catch (error) {
    return {
      status: 'ERRO',
      error: String(error)
    }
  }
}

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'DEVELOPER'] }
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    const activeAdmins = users.filter(u => u.isActive && u.role === 'ADMIN')
    const activeDevs = users.filter(u => u.isActive && u.role === 'DEVELOPER')

    if (activeAdmins.length === 0 && activeDevs.length === 0) {
      return {
        status: 'AVISO',
        message: 'Nenhum admin/developer ativo encontrado',
        total: users.length,
        users: users.map(u => ({
          email: u.email,
          role: u.role,
          isActive: u.isActive
        }))
      }
    }

    return {
      status: 'OK',
      total: users.length,
      activeAdmins: activeAdmins.length,
      activeDevs: activeDevs.length,
      users: users.map(u => ({
        email: u.email,
        role: u.role,
        isActive: u.isActive
      }))
    }
  } catch (error) {
    return {
      status: 'ERRO',
      error: String(error)
    }
  }
}

function checkEnvironment() {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'AUTH_SECRET'
  ]

  const optional = [
    'NEXTAUTH_SECRET',
    'ASAAS_API_KEY',
    'ASAAS_API_URL',
    'ASAAS_WEBHOOK_TOKEN'
  ]

  const missing: string[] = []
  const present: string[] = []
  const optionalMissing: string[] = []

  for (const key of required) {
    if (process.env[key]) {
      present.push(key)
    } else {
      missing.push(key)
    }
  }

  for (const key of optional) {
    if (!process.env[key]) {
      optionalMissing.push(key)
    } else {
      present.push(key)
    }
  }

  // Verificar valores específicos
  const details: Record<string, string> = {}
  
  if (process.env.NEXTAUTH_URL) {
    details.NEXTAUTH_URL = process.env.NEXTAUTH_URL
  }
  
  if (process.env.NODE_ENV) {
    details.NODE_ENV = process.env.NODE_ENV
  }
  
  if (process.env.VERCEL_ENV) {
    details.VERCEL_ENV = process.env.VERCEL_ENV
  }

  return {
    status: missing.length > 0 ? 'ERRO' : optionalMissing.length > 0 ? 'AVISO' : 'OK',
    required: {
      present: present.filter(k => required.includes(k)),
      missing
    },
    optional: {
      present: present.filter(k => optional.includes(k)),
      missing: optionalMissing
    },
    details
  }
}

function checkRoutes() {
  // Lista de rotas esperadas e seus arquivos
  const criticalRoutes = [
    { path: '/login', group: '(auth)' },
    { path: '/cadastro', group: '(auth)' },
    { path: '/planos', group: '(auth)' },
    { path: '/checkout/[planId]', group: '(public)' },
    { path: '/admin', group: '(admin)' },
    { path: '/app', group: '(app)' },
    { path: '/parceiro', group: '(parceiro)' },
    { path: '/developer', group: '(developer)' }
  ]

  // APIs esperadas
  const criticalApis = [
    '/api/auth/[...nextauth]',
    '/api/public/plans',
    '/api/plans/public',
    '/api/checkout/asaas',
    '/api/app/planos',
    '/api/admin/plans'
  ]

  return {
    status: 'OK',
    message: 'Verificação de rotas requer acesso ao filesystem (use em dev)',
    expectedRoutes: criticalRoutes,
    expectedApis: criticalApis,
    note: 'Para verificar se as rotas existem, acesse cada uma manualmente ou use testes automatizados'
  }
}
