import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { subDays, startOfDay, format } from 'date-fns'

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

    // Logs dos últimos 7 dias
    const sevenDaysAgo = subDays(new Date(), 7)

    const logsLast7Days = await prisma.systemLog.groupBy({
      by: ['type'],
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      _count: true,
    })

    // Logs por dia (últimos 7 dias)
    const logsByDay = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM system_logs
      WHERE created_at >= ${sevenDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // Formatar logs por dia
    const activityByDay = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayData = logsByDay.find((l: { date: string; count: bigint }) => format(new Date(l.date), 'yyyy-MM-dd') === dateStr)
      activityByDay.push({
        date: format(date, 'dd/MM'),
        day: format(date, 'EEE'),
        count: dayData ? Number(dayData.count) : 0,
      })
    }

    // Últimos 5 logs
    const recentLogs = await prisma.systemLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true },
        },
      },
    })

    // Logins hoje
    const todayStart = startOfDay(new Date())
    const loginsToday = await prisma.systemLog.count({
      where: {
        type: 'AUTH',
        action: 'LOGIN',
        createdAt: { gte: todayStart },
      },
    })

    // Login failures hoje
    const loginFailuresToday = await prisma.systemLog.count({
      where: {
        type: 'AUTH',
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
        byType: logsLast7Days.reduce((acc: Record<string, number>, curr: { type: string; _count: number }) => {
          acc[curr.type] = curr._count
          return acc
        }, {} as Record<string, number>),
        loginsToday,
        loginFailuresToday,
      },
      activity: activityByDay,
      recentLogs: recentLogs.map((log: { id: string; type: string; action: string; message: string; user: { email: string } | null; createdAt: Date }) => ({
        id: log.id,
        type: log.type,
        action: log.action,
        message: log.message,
        user: log.user?.email || 'system',
        createdAt: log.createdAt,
      })),
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
