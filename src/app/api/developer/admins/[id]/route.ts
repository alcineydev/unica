import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { sendEmailChangeConfirmation } from '@/lib/email'

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

// PATCH - Atualizar admin
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
    const { name, email, phone, password, isActive } = body

    console.log('[ADMIN UPDATE] Iniciando atualização:', { id, name, email, phone, hasPassword: !!password, passwordLength: password?.length })

    const admin = await prisma.admin.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin não encontrado' }, { status: 404 })
    }

    // Verificar se o e-mail está sendo alterado
    const emailChanged = email && email !== admin.user.email

    if (emailChanged) {
      // Verificar se novo e-mail já existe
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Este e-mail já está em uso' },
          { status: 400 }
        )
      }

      // Cancelar mudanças pendentes anteriores
      await prisma.pendingEmailChange.deleteMany({
        where: { userId: admin.userId },
      })

      // Criar token de confirmação
      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

      // Salvar mudança pendente
      await prisma.pendingEmailChange.create({
        data: {
          userId: admin.userId,
          oldEmail: admin.user.email,
          newEmail: email,
          token,
          expiresAt,
        },
      })

      // Enviar e-mail de confirmação
      await sendEmailChangeConfirmation(
        email,
        admin.name || 'Administrador',
        admin.user.email,
        token
      )
    }

    // Atualizar status do usuário se informado
    if (isActive !== undefined) {
      await prisma.user.update({
        where: { id: admin.userId },
        data: { isActive },
      })

      // Registrar log
      await prisma.systemLog.create({
        data: {
          level: 'info',
          action: isActive ? 'ACTIVATE_ADMIN' : 'DEACTIVATE_ADMIN',
          userId: session.user.id!,
          details: { entity: 'Admin', entityId: id, adminEmail: admin.user.email },
        },
      })
    }

    // Preparar dados para atualização do usuário
    const userUpdateData: any = {}
    const changes: string[] = []

    // CORREÇÃO: Verificar se a senha foi fornecida e tem tamanho válido
    if (password && typeof password === 'string' && password.length >= 6) {
      console.log('[ADMIN UPDATE] Gerando hash da nova senha...')
      const hashedPassword = await bcrypt.hash(password, 12)
      userUpdateData.password = hashedPassword
      changes.push('senha')
      console.log('[ADMIN UPDATE] Hash gerado com sucesso')
    } else if (password && password.length > 0 && password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    if (phone !== undefined && phone !== admin.phone) {
      userUpdateData.phone = phone || null
      changes.push('telefone')
    }

    console.log('[ADMIN UPDATE] Campos do user a atualizar:', Object.keys(userUpdateData))

    // Atualizar dados do usuário se houver campos
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: admin.userId },
        data: userUpdateData,
      })
      console.log('[ADMIN UPDATE] User atualizado com sucesso')
    }

    // Verificar se nome foi alterado
    if (name && name !== admin.name) {
      changes.push('nome')
    }

    // Atualizar dados do admin
    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: {
        name: name || admin.name,
        phone: phone !== undefined ? phone : admin.phone,
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

    console.log('[ADMIN UPDATE] Admin atualizado. Changes:', changes)

    // Montar mensagem de resposta
    let message = ''
    if (emailChanged && changes.length > 0) {
      message = `Link de confirmação enviado para ${email}. ${changes.join(', ')} atualizado(s) com sucesso.`
    } else if (emailChanged) {
      message = `Link de confirmação enviado para ${email}`
    } else if (changes.length > 0) {
      message = `${changes.join(', ')} atualizado(s) com sucesso`
    } else {
      message = 'Nenhuma alteração realizada'
    }

    return NextResponse.json({
      success: true,
      data: updatedAdmin,
      emailPending: emailChanged,
      passwordChanged: changes.includes('senha'),
      changes,
      message
    })
  } catch (error) {
    console.error('[ADMIN UPDATE] Erro:', error)
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

    // Deletar mudanças de e-mail pendentes
    await prisma.pendingEmailChange.deleteMany({
      where: { userId: admin.userId },
    })

    // Deletar admin e usuário
    await prisma.$transaction([
      prisma.admin.delete({ where: { id } }),
      prisma.user.delete({ where: { id: admin.userId } }),
    ])

    // Registrar log
    await prisma.systemLog.create({
      data: {
        level: 'info',
        action: 'DELETE_ADMIN',
        userId: session.user.id!,
        details: { entity: 'Admin', entityId: id, adminEmail: admin.user.email, adminName: admin.name },
      },
    })

    return NextResponse.json({ message: 'Admin removido com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar admin:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
