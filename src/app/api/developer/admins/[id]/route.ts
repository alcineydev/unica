import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

// GET - Buscar admin por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    const admin = await prisma.admin.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin não encontrado' }, { status: 404 })
    }

    return NextResponse.json(admin)
  } catch (error) {
    console.error('Erro ao buscar admin:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar admin (ativar/desativar)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const admin = await prisma.admin.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin não encontrado' }, { status: 404 })
    }

    // Atualizar status do usuário
    if (body.isActive !== undefined) {
      await prisma.user.update({
        where: { id: admin.userId },
        data: { isActive: body.isActive },
      })

      // Registrar log
      if (body.isActive) {
        await logger.adminActivated(session.user.id!, id, admin.user.email)
      } else {
        await logger.adminDeactivated(session.user.id!, id, admin.user.email)
      }
    }

    // Atualizar dados do admin
    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: {
        name: body.name || admin.name,
        phone: body.phone || admin.phone,
        permissions: body.permissions || admin.permissions,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    })

    return NextResponse.json(updatedAdmin)
  } catch (error) {
    console.error('Erro ao atualizar admin:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    const admin = await prisma.admin.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin não encontrado' }, { status: 404 })
    }

    // Deletar admin e usuário
    await prisma.$transaction([
      prisma.admin.delete({ where: { id } }),
      prisma.user.delete({ where: { id: admin.userId } }),
    ])

    // Registrar log
    await logger.adminDeleted(session.user.id!, admin.user.email)

    return NextResponse.json({ message: 'Admin removido com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar admin:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

