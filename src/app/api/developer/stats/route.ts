import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const [totalAdmins, totalLogs, totalUsers] = await Promise.all([
      prisma.admin.count(),
      prisma.systemLog.count(),
      prisma.user.count(),
    ])

    // Verificar conexão com o banco
    let dbStatus = 'Conectado'
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch {
      dbStatus = 'Erro de conexão'
    }

    return NextResponse.json({
      totalAdmins,
      totalLogs,
      totalUsers,
      dbStatus,
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

