import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET - Listar notificações
export async function GET(request: Request) {
  const session = await auth()
  
  if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    const where = status ? { status: status as any } : {}

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          instance: {
            select: { name: true }
          },
          targetPlan: {
            select: { name: true }
          },
          targetCity: {
            select: { name: true }
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ])

    return NextResponse.json({
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Erro ao listar notificações:', error)
    return NextResponse.json({ error: 'Erro ao listar notificações' }, { status: 500 })
  }
}

// POST - Criar notificação
export async function POST(request: Request) {
  const session = await auth()
  
  if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { 
      title, 
      message, 
      imageUrl, 
      linkUrl, 
      linkText,
      instanceId,
      targetType,
      targetPlanId,
      targetCityId,
      individualNumber,
      status = 'DRAFT'
    } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Título e mensagem são obrigatórios' }, { status: 400 })
    }

    if (!instanceId) {
      return NextResponse.json({ error: 'Instância WhatsApp é obrigatória' }, { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        linkText: linkText || null,
        targetType,
        targetPlanId: targetPlanId || null,
        targetCityId: targetCityId || null,
        individualNumber: individualNumber || null,
        instanceId,
        status,
      },
      include: {
        instance: {
          select: { name: true }
        },
      },
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    return NextResponse.json({ error: 'Erro ao criar notificação' }, { status: 500 })
  }
}

