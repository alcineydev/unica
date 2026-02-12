import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar conexão com banco
    let dbStatus = 'offline'
    try {
      await prisma.$queryRaw`SELECT 1`
      dbStatus = 'connected'
    } catch {
      dbStatus = 'offline'
    }

    // Contar registros
    const [totalAdmins, totalLogs, totalUsers] = await Promise.all([
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.systemLog.count(),
      prisma.user.count(),
    ])

    return NextResponse.json({
      totalAdmins,
      totalLogs,
      totalUsers,
      dbStatus,
    })
  } catch (error) {
    console.error('Erro ao buscar stats:', error)
    return NextResponse.json({
      totalAdmins: 0,
      totalLogs: 0,
      totalUsers: 0,
      dbStatus: 'offline',
    })
  }
}
