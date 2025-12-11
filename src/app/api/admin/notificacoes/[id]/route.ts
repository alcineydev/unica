import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET - Detalhes da notificação
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params

  try {
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        instance: {
          select: { name: true, instanceId: true }
        },
        targetPlan: {
          select: { name: true }
        },
        targetCity: {
          select: { name: true }
        },
      },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Erro ao buscar notificação:', error)
    return NextResponse.json({ error: 'Erro ao buscar notificação' }, { status: 500 })
  }
}

// PATCH - Atualizar notificação (rascunho)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()

    // Verificar se a notificação existe e é um rascunho
    const existing = await prisma.notification.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }

    if (existing.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Apenas rascunhos podem ser editados' }, { status: 400 })
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        title: body.title,
        message: body.message,
        imageUrl: body.imageUrl || null,
        linkUrl: body.linkUrl || null,
        linkText: body.linkText || null,
        targetType: body.targetType,
        targetPlanId: body.targetPlanId || null,
        targetCityId: body.targetCityId || null,
        instanceId: body.instanceId,
      },
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error)
    return NextResponse.json({ error: 'Erro ao atualizar notificação' }, { status: 500 })
  }
}

// DELETE - Excluir notificação
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session || !['ADMIN', 'DEVELOPER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params

  try {
    await prisma.notification.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir notificação:', error)
    return NextResponse.json({ error: 'Erro ao excluir notificação' }, { status: 500 })
  }
}

