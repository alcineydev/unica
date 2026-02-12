import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { EmailService } from '@/lib/email-service'

// GET - Buscar admin específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: 'ADMIN',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Administrador não encontrado' }, { status: 404 })
    }

    return NextResponse.json(admin)
  } catch (error) {
    console.error('Erro ao buscar admin:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Atualizar admin
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, password, isActive } = body

    // Buscar admin atual
    const currentAdmin = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: 'ADMIN',
      },
    })

    if (!currentAdmin) {
      return NextResponse.json({ error: 'Administrador não encontrado' }, { status: 404 })
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (typeof isActive === 'boolean') updateData.isActive = isActive

    // Se nova senha foi fornecida
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Atualizar
    const updatedAdmin = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Log
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        action: isActive === false ? 'DEACTIVATE_ADMIN' : isActive === true ? 'ACTIVATE_ADMIN' : 'UPDATE_ADMIN',
        userId: params.id,
        details: {
          updatedFields: Object.keys(updateData),
          performedBy: session.user.id,
        },
      },
    })

    return NextResponse.json(updatedAdmin)
  } catch (error) {
    console.error('Erro ao atualizar admin:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Remover admin
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar admin
    const admin = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: 'ADMIN',
      },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Administrador não encontrado' }, { status: 404 })
    }

    // Não permitir excluir a si mesmo
    if (admin.id === session.user.id) {
      return NextResponse.json({ error: 'Você não pode excluir sua própria conta' }, { status: 400 })
    }

    // Deletar
    await prisma.user.delete({
      where: { id: params.id },
    })

    // Enviar notificação por email
    await EmailService.sendAccountDeletionNotice(admin.email, admin.name || 'Administrador')

    // Log
    await prisma.systemLog.create({
      data: {
        level: 'WARN',
        action: 'DELETE_ADMIN',
        userId: params.id,
        details: {
          deletedEmail: admin.email,
          deletedName: admin.name,
          performedBy: session.user.id,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar admin:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
