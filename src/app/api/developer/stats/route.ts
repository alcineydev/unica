import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { subDays, startOfDay, format, eachDayOfInterval } from 'date-fns'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Contagens gerais
    const [
      totalAdmins,
      totalParceiros,
      totalAssinantes,
      totalBeneficios,
      totalPlanos,
      totalCategorias,
      totalCidades,
      activeAdmins,
      activeParceiros,
      activeAssinantes,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.parceiro.count(),
      prisma.assinante.count(),
      prisma.benefit.count(),
      prisma.plan.count(),
      prisma.category.count(),
      prisma.city.count(),
      prisma.user.count({ where: { role: 'ADMIN', isActive: true } }),
      prisma.parceiro.count({ where: { isActive: true } }),
      prisma.assinante.count({ where: { subscriptionStatus: 'ACTIVE' } }),
    ])

    // Logs dos últimos 7 dias - usando 'level' (campo correto do schema)
    const sevenDaysAgo = subDays(new Date(), 7)

    const logsLast7Days = await prisma.systemLog.groupBy({
      by: ['level'],
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      _count: true,
    })

    // Logs por dia (últimos 7 dias)
    const days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    })

    const activityByDay = await Promise.all(
      days.map(async (day) => {
        const dayStart = startOfDay(day)
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayEnd.getDate() + 1)

        const count = await prisma.systemLog.count({
          where: {
            createdAt: {
              gte: dayStart,
              lt: dayEnd,
            },
          },
        })

        return {
          date: format(day, 'dd/MM'),
          day: format(day, 'EEE'),
          count,
        }
      })
    )

    // Últimos 5 logs (sem include de user, pois SystemLog não tem essa relação)
    const recentLogs = await prisma.systemLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    })

    // Logins hoje (usando action ao invés de type)
    const todayStart = startOfDay(new Date())
    const loginsToday = await prisma.systemLog.count({
      where: {
        action: 'LOGIN',
        createdAt: { gte: todayStart },
      },
    })

    // Login failures hoje
    const loginFailuresToday = await prisma.systemLog.count({
      where: {
        action: 'LOGIN_FAILED',
        createdAt: { gte: todayStart },
      },
    })

    // Total de logs
    const totalLogs = await prisma.systemLog.count()

    return NextResponse.json({
      counts: {
        admins: { total: totalAdmins, active: activeAdmins },
        parceiros: { total: totalParceiros, active: activeParceiros },
        assinantes: { total: totalAssinantes, active: activeAssinantes },
        beneficios: totalBeneficios,
        planos: totalPlanos,
        categorias: totalCategorias,
        cidades: totalCidades,
      },
      logs: {
        total: totalLogs,
        byLevel: logsLast7Days.reduce((acc: Record<string, number>, curr: { level: string; _count: number }) => {
          acc[curr.level] = curr._count
          return acc
        }, {} as Record<string, number>),
        loginsToday,
        loginFailuresToday,
      },
      activity: activityByDay,
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        level: log.level,
        action: log.action,
        userId: log.userId,
        createdAt: log.createdAt,
      })),
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
