import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email-service'

// Store temporário para códigos (em produção, usar Redis)
const verificationCodes = new Map<string, { code: string; newEmail: string; expiresAt: Date }>()

// POST - Enviar código de verificação
export async function POST(request: Request) {
    try {
        const session = await auth()

        if (!session || session.user.role !== 'DEVELOPER') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { adminId, newEmail } = await request.json()

        if (!adminId || !newEmail) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
        }

        // Buscar admin
        const admin = await prisma.user.findUnique({
            where: { id: adminId },
        })

        if (!admin) {
            return NextResponse.json({ error: 'Administrador não encontrado' }, { status: 404 })
        }

        // Verificar se novo email já está em uso
        const emailExists = await prisma.user.findUnique({
            where: { email: newEmail },
        })

        if (emailExists && emailExists.id !== adminId) {
            return NextResponse.json({ error: 'Este email já está em uso' }, { status: 400 })
        }

        // Gerar código
        const code = EmailService.generateVerificationCode()

        // Salvar código (expira em 10 minutos)
        verificationCodes.set(adminId, {
            code,
            newEmail,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        })

        // Enviar email
        const sent = await EmailService.sendEmailChangeVerification(
            admin.email,
            newEmail,
            code,
            admin.name || 'Administrador'
        )

        if (!sent) {
            return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 })
        }

        // Log
        await prisma.systemLog.create({
            data: {
                level: 'INFO',
                action: 'EMAIL_CHANGE_REQUESTED',
                userId: adminId,
                details: { newEmail },
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Código enviado para o email atual'
        })
    } catch (error) {
        console.error('Erro ao enviar código:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// PUT - Verificar código e atualizar email
export async function PUT(request: Request) {
    try {
        const session = await auth()

        if (!session || session.user.role !== 'DEVELOPER') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { adminId, code } = await request.json()

        if (!adminId || !code) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
        }

        // Buscar código salvo
        const savedData = verificationCodes.get(adminId)

        if (!savedData) {
            return NextResponse.json({ error: 'Código expirado ou não encontrado' }, { status: 400 })
        }

        // Verificar expiração
        if (new Date() > savedData.expiresAt) {
            verificationCodes.delete(adminId)
            return NextResponse.json({ error: 'Código expirado' }, { status: 400 })
        }

        // Verificar código
        if (savedData.code !== code) {
            return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
        }

        // Buscar admin para pegar nome
        const admin = await prisma.user.findUnique({
            where: { id: adminId },
        })

        // Atualizar email
        await prisma.user.update({
            where: { id: adminId },
            data: { email: savedData.newEmail },
        })

        // Limpar código
        verificationCodes.delete(adminId)

        // Enviar confirmação para novo email
        await EmailService.sendEmailChangeConfirmation(
            savedData.newEmail,
            admin?.name || 'Administrador'
        )

        // Log
        await prisma.systemLog.create({
            data: {
                level: 'INFO',
                action: 'EMAIL_CHANGED',
                userId: adminId,
                details: { newEmail: savedData.newEmail },
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Email atualizado com sucesso'
        })
    } catch (error) {
        console.error('Erro ao verificar código:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
