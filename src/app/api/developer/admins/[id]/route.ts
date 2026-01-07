import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { sendEmailChangeConfirmation } from '@/lib/email'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

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

    const admin = await prisma.user.findUnique({
      where: { id, role: 'ADMIN' },
      include: { admin: true },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      id: admin.id,
      name: admin.admin?.name || admin.email.split('@')[0],
      email: admin.email,
      phone: admin.admin?.phone || admin.phone,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
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

    // Verificar se é toggle de status
    if (body.isActive !== undefined && Object.keys(body).length === 1) {
      const admin = await prisma.user.findUnique({
        where: { id, role: 'ADMIN' },
        include: { admin: true },
      })

      if (!admin) {
        return NextResponse.json({ error: 'Admin não encontrado' }, { status: 404 })
      }

      await prisma.user.update({
        where: { id },
        data: { isActive: body.isActive },
      })

      if (body.isActive) {
        await logger.adminActivated(session.user.id!, id, admin.email)
      } else {
        await logger.adminDeactivated(session.user.id!, id, admin.email)
      }

      return NextResponse.json({
        success: true,
        message: body.isActive ? 'Admin ativado' : 'Admin desativado',
      })
    }

    const { name, email, phone, password } = body

    const admin = await prisma.user.findUnique({
      where: { id, role: 'ADMIN' },
      include: { admin: true },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin não encontrado' }, { status: 404 })
    }

    const emailChanged = email && email !== admin.email

    if (emailChanged) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Este e-mail já está em uso' },
          { status: 400 }
        )
      }

      await prisma.pendingEmailChange.deleteMany({
        where: { userId: id },
      })

      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await prisma.pendingEmailChange.create({
        data: {
          userId: id,
          oldEmail: admin.email,
          newEmail: email,
          token,
          expiresAt,
        },
      })

      await sendEmailChangeConfirmation(
        email,
        admin.admin?.name || 'Administrador',
        admin.email,
        token
      )

      await logger.emailChangeRequested(session.user.id!, admin.email, email)
    }

    const userUpdateData: Record<string, unknown> = {}
    const adminUpdateData: Record<string, unknown> = {}
    const changes: string[] = []

    if (name && name !== admin.admin?.name) {
      adminUpdateData.name = name
      changes.push('nome')
    }

    if (phone !== undefined) {
      userUpdateData.phone = phone || null
      adminUpdateData.phone = phone || null
      changes.push('telefone')
    }

    if (password && typeof password === 'string' && password.length >= 6) {
      userUpdateData.password = await bcrypt.hash(password, 12)
      changes.push('senha')
      await logger.passwordChanged(session.user.id!, id, admin.email)
    }

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id },
        data: userUpdateData,
      })
    }

    if (Object.keys(adminUpdateData).length > 0 && admin.admin) {
      await prisma.admin.update({
        where: { id: admin.admin.id },
        data: adminUpdateData,
      })
    }

    if (changes.length > 0) {
      await logger.adminUpdated(session.user.id!, id, admin.email, changes)
    }

    return NextResponse.json({
      success: true,
      emailPending: emailChanged,
      passwordChanged: changes.includes('senha'),
      changes,
      message: emailChanged
        ? `Link de confirmação enviado para ${email}`
        : changes.length > 0
        ? `${changes.join(', ')} atualizado(s)`
        : 'Nenhuma alteração',
    })
  } catch (error) {
    console.error('Erro ao atualizar admin:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Excluir admin
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

    const admin = await prisma.user.findUnique({
      where: { id, role: 'ADMIN' },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin não encontrado' }, { status: 404 })
    }

    await prisma.pendingEmailChange.deleteMany({
      where: { userId: id },
    })

    await prisma.admin.deleteMany({
      where: { userId: id },
    })

    await prisma.user.delete({
      where: { id },
    })

    await logger.adminDeleted(session.user.id!, admin.email)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir admin:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}