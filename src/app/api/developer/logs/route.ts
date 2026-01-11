import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

// GET - Listar logs com paginação e filtros
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const level = searchParams.get('level') || undefined
    const action = searchParams.get('action') || undefined
    const search = searchParams.get('search') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (level) {
      where.level = level
    }

    if (action) {
      where.action = action
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { userId: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.systemLog.count({ where }),
    ])

    // Estatísticas por level
    const stats = await prisma.systemLog.groupBy({
      by: ['level'],
      _count: true,
    })

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: stats.reduce((acc, curr) => {
        acc[curr.level] = curr._count
        return acc
      }, {} as Record<string, number>),
    })
  } catch (error) {
    console.error('Erro ao listar logs:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
