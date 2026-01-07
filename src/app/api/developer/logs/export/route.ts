import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const formatType = searchParams.get('format') || 'json' // json ou csv
    const type = searchParams.get('type') || undefined
    const action = searchParams.get('action') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const limit = parseInt(searchParams.get('limit') || '1000')

    // Construir filtros
    const where: Record<string, unknown> = {}

    if (type) {
      where.type = type
    }

    if (action) {
      where.action = action
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        ;(where.createdAt as Record<string, Date>).lte = end
      }
    }

    // Buscar logs
    const logs = await prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 10000), // Máximo 10k registros
      include: {
        user: {
          select: { email: true },
        },
      },
    })

    // Formatar dados
    const formattedLogs = logs.map(log => ({
      id: log.id,
      type: log.type,
      action: log.action,
      message: log.message,
      details: log.details || '',
      user: log.user?.email || 'system',
      userId: log.userId || '',
      targetId: log.targetId || '',
      ip: log.ip || '',
      userAgent: log.userAgent || '',
      createdAt: format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
      createdAtISO: log.createdAt.toISOString(),
    }))

    if (formatType === 'csv') {
      // Gerar CSV
      const headers = [
        'ID',
        'Tipo',
        'Ação',
        'Mensagem',
        'Detalhes',
        'Usuário',
        'User ID',
        'Target ID',
        'IP',
        'User Agent',
        'Data/Hora',
        'Data ISO',
      ]

      const csvRows = [
        headers.join(';'),
        ...formattedLogs.map(log => [
          log.id,
          log.type,
          log.action,
          `"${log.message.replace(/"/g, '""')}"`,
          `"${log.details.replace(/"/g, '""')}"`,
          log.user,
          log.userId,
          log.targetId,
          log.ip,
          `"${log.userAgent.replace(/"/g, '""')}"`,
          log.createdAt,
          log.createdAtISO,
        ].join(';'))
      ]

      const csv = csvRows.join('\n')
      const filename = `logs_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // JSON (padrão)
    const filename = `logs_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`

    return new NextResponse(JSON.stringify(formattedLogs, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Erro ao exportar logs:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
