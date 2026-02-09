import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import crypto from 'crypto'
import { getEmailService } from '@/services/email'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { newEmail } = await request.json()

        if (!newEmail || !newEmail.includes('@')) {
            return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
        }

        // Verificar se o email já está em uso
        const existingUser = await prisma.user.findUnique({
            where: { email: newEmail.toLowerCase() }
        })

        if (existingUser) {
            return NextResponse.json({ error: 'Este e-mail já está em uso' }, { status: 400 })
        }

        // Gerar token de confirmação
        const token = crypto.randomBytes(32).toString('hex')
        const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

        // Salvar pending email
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                pendingEmail: newEmail.toLowerCase(),
                emailChangeToken: token,
                emailChangeExpiry: expiry,
            }
        })

        // Enviar email de confirmação
        const baseUrl = process.env.NEXTAUTH_URL || 'https://app.unicabeneficios.com.br'
        const confirmUrl = `${baseUrl}/api/admin/confirm-email?token=${token}`

        const emailService = getEmailService()
        if (emailService) {
            await emailService.sendEmail({
                to: newEmail,
                subject: 'Confirme seu novo e-mail - UNICA Benefícios',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">UNICA Benefícios</h1>
            <p>Você solicitou a alteração do seu e-mail.</p>
            <p>Clique no botão abaixo para confirmar:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmUrl}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Confirmar Novo E-mail
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Este link expira em 24 horas.</p>
          </div>
        `,
                text: `Confirme seu novo e-mail acessando: ${confirmUrl}`
            })
        }

        return NextResponse.json({
            message: 'Link de confirmação enviado para o novo e-mail!'
        })
    } catch (error) {
        console.error('[CHANGE-EMAIL] Erro:', error)
        return NextResponse.json({ error: 'Erro ao processar solicitação' }, { status: 500 })
    }
}
