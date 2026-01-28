import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getEmailService } from '@/services/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // SEGURANÇA: Sempre retornar sucesso (não revelar se email existe)
    if (!user) {
      console.log(`[FORGOT-PASSWORD] Email não encontrado: ${email}`)
      return NextResponse.json({ 
        success: true,
        message: 'Se o email existir, você receberá as instruções' 
      })
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      console.log(`[FORGOT-PASSWORD] Usuário inativo: ${email}`)
      return NextResponse.json({ 
        success: true,
        message: 'Se o email existir, você receberá as instruções' 
      })
    }

    // Invalidar tokens anteriores do usuário
    await prisma.passwordResetToken.updateMany({
      where: { 
        userId: user.id,
        used: false 
      },
      data: { used: true }
    })

    // Gerar novo token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Salvar token no banco
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt
      }
    })

    // Montar URL de reset
    const baseUrl = process.env.NEXTAUTH_URL || 'https://app.unicabeneficios.com.br'
    const resetUrl = `${baseUrl}/redefinir-senha?token=${token}`

    // Enviar email usando EmailService
    try {
      const emailService = getEmailService()
      
      if (emailService) {
        await emailService.sendEmail({
          to: user.email,
          subject: 'Recuperação de Senha - UNICA Benefícios',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #7c3aed; margin: 0;">UNICA Benefícios</h1>
              </div>
              
              <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
                <h2 style="margin-top: 0; color: #1e293b;">Recuperação de Senha</h2>
                
                <p>Olá,</p>
                
                <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
                
                <p>Clique no botão abaixo para criar uma nova senha:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" 
                     style="background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Redefinir Minha Senha
                  </a>
                </div>
                
                <p style="color: #64748b; font-size: 14px;">
                  Este link expira em <strong>1 hora</strong>.
                </p>
                
                <p style="color: #64748b; font-size: 14px;">
                  Se você não solicitou esta alteração, ignore este email. Sua senha permanecerá a mesma.
                </p>
              </div>
              
              <div style="text-align: center; color: #94a3b8; font-size: 12px;">
                <p>UNICA Clube de Benefícios</p>
                <p>Este é um email automático, não responda.</p>
              </div>
            </body>
            </html>
          `,
          text: `Recuperação de Senha - UNICA Benefícios\n\nRecebemos uma solicitação para redefinir a senha da sua conta.\n\nAcesse o link abaixo para criar uma nova senha:\n${resetUrl}\n\nEste link expira em 1 hora.\n\nSe você não solicitou esta alteração, ignore este email.`
        })

        console.log(`[FORGOT-PASSWORD] Email enviado para: ${email}`)
      } else {
        console.warn('[FORGOT-PASSWORD] EmailService não configurado - RESEND_API_KEY não definida')
        // Logar a URL para debug em desenvolvimento
        console.log(`[FORGOT-PASSWORD] Reset URL (debug): ${resetUrl}`)
      }

    } catch (emailError) {
      console.error('[FORGOT-PASSWORD] Erro ao enviar email:', emailError)
      // Não retornar erro para o usuário por segurança
    }

    return NextResponse.json({ 
      success: true,
      message: 'Se o email existir, você receberá as instruções'
    })

  } catch (error) {
    console.error('[FORGOT-PASSWORD] Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
