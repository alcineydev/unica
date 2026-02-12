import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { EmailService } from '@/lib/email-service'

// GET - Buscar admin específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Buscar User com role ADMIN e incluir dados do Admin
    const user = await prisma.user.findUnique({
      where: {
        id,
        role: 'ADMIN',
      },
      include: {
        admin: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Administrador não encontrado' }, { status: 404 })
    }

    // Formatar resposta
    return NextResponse.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Dados do Admin
      name: user.admin?.name || null,
      adminId: user.admin?.id || null,
    })
  } catch (error) {
    console.error('Erro ao buscar admin:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Atualizar admin
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, phone, password, isActive } = body

    // Buscar admin atual
    const currentUser = await prisma.user.findUnique({
      where: {
        id,
        role: 'ADMIN',
      },
      include: {
        admin: true,
      },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Administrador não encontrado' }, { status: 404 })
    }

    // Preparar dados para atualização do User
    const userUpdateData: Record<string, unknown> = {}
    if (phone !== undefined) userUpdateData.phone = phone
    if (typeof isActive === 'boolean') userUpdateData.isActive = isActive

    // Se nova senha foi fornecida
    if (password && password.length >= 6) {
      userUpdateData.password = await bcrypt.hash(password, 10)
    }

    // Atualizar User
    const updatedUser = await prisma.user.update({
      where: { id },
      data: userUpdateData,
    })

    // Atualizar Admin (name) se fornecido
    if (name !== undefined && currentUser.admin) {
      await prisma.admin.update({
        where: { id: currentUser.admin.id },
        data: { name },
      })
    }

    // Buscar dados atualizados
    const finalUser = await prisma.user.findUnique({
      where: { id },
      include: { admin: true },
    })

    // Log
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        action: isActive === false ? 'DEACTIVATE_ADMIN' : isActive === true ? 'ACTIVATE_ADMIN' : 'UPDATE_ADMIN',
        userId: id,
        details: {
          updatedFields: [...Object.keys(userUpdateData), ...(name !== undefined ? ['name'] : [])],
          performedBy: session.user.id,
        },
      },
    })

    return NextResponse.json({
      id: finalUser?.id,
      email: finalUser?.email,
      phone: finalUser?.phone,
      isActive: finalUser?.isActive,
      createdAt: finalUser?.createdAt,
      updatedAt: finalUser?.updatedAt,
      name: finalUser?.admin?.name || null,
      adminId: finalUser?.admin?.id || null,
    })
  } catch (error) {
    console.error('Erro ao atualizar admin:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Remover admin
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'DEVELOPER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Buscar admin
    const user = await prisma.user.findUnique({
      where: {
        id,
        role: 'ADMIN',
      },
      include: {
        admin: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Administrador não encontrado' }, { status: 404 })
    }

    // Não permitir excluir a si mesmo
    if (user.id === session.user.id) {
      return NextResponse.json({ error: 'Você não pode excluir sua própria conta' }, { status: 400 })
    }

    // Deletar Admin primeiro (se existir)
    if (user.admin) {
      await prisma.admin.delete({
        where: { id: user.admin.id },
      })
    }

    // Deletar User
    await prisma.user.delete({
      where: { id },
    })

    // Enviar notificação por email
    await EmailService.sendAccountDeletionNotice(
      user.email,
      user.admin?.name || 'Administrador'
    )

    // Log
    await prisma.systemLog.create({
      data: {
        level: 'WARN',
        action: 'DELETE_ADMIN',
        userId: id,
        details: {
          deletedEmail: user.email,
          deletedName: user.admin?.name,
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
