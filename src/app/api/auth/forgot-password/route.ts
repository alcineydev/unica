import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getEmailService } from '@/services/email'
import crypto from 'crypto'

// Função para detectar URL base de forma robusta
function getBaseUrl(req: NextRequest): string {
  // 1. Tentar pegar do header da requisição
  const host = req.headers.get('host')
  const protocol = req.headers.get('x-forwarded-proto') || 'https'
  
  if (host && host.includes('unicabeneficios.com.br')) {
    return `${protocol}://${host}`
  }
  
  // 2. Tentar variável de ambiente NEXTAUTH_URL
  const nextAuthUrl = process.env.NEXTAUTH_URL
  if (nextAuthUrl && nextAuthUrl.trim() !== '') {
    return nextAuthUrl.trim()
  }
  
  // 3. Tentar NEXT_PUBLIC_APP_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl && appUrl.trim() !== '') {
    return appUrl.trim()
  }
  
  // 4. Detectar por VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // 5. Fallback final
  return 'https://app.unicabeneficios.com.br'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    console.log('[FORGOT-PASSWORD] Iniciando para email:', email)

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
      console.log('[FORGOT-PASSWORD] Email não encontrado:', email)
      return NextResponse.json({ 
        success: true,
        message: 'Se o email existir, você receberá as instruções' 
      })
    }

    console.log('[FORGOT-PASSWORD] Usuário encontrado:', user.id)

    // Verificar se usuário está ativo
    if (!user.isActive) {
      console.log('[FORGOT-PASSWORD] Usuário inativo:', email)
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

    console.log('[FORGOT-PASSWORD] Token gerado:', token.substring(0, 10) + '...')

    // Salvar token no banco
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt
      }
    })

    // Montar URL de reset
    const baseUrl = getBaseUrl(request)
    const resetUrl = `${baseUrl}/redefinir-senha?token=${token}`

    // DEBUG: Logs importantes
    console.log('[FORGOT-PASSWORD] ====== DEBUG URLs ======')
    console.log('[FORGOT-PASSWORD] Host header:', request.headers.get('host'))
    console.log('[FORGOT-PASSWORD] NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
    console.log('[FORGOT-PASSWORD] NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
    console.log('[FORGOT-PASSWORD] Base URL final:', baseUrl)
    console.log('[FORGOT-PASSWORD] Reset URL completa:', resetUrl)
    console.log('[FORGOT-PASSWORD] ========================')

    // Verificar se a URL está válida
    if (!resetUrl || resetUrl === '/redefinir-senha?token=' || !resetUrl.startsWith('http')) {
      console.error('[FORGOT-PASSWORD] ERRO: URL inválida!', resetUrl)
    }

    // HTML do email
    const emailHtml = `
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
            Ou copie e cole este link no seu navegador:
          </p>
          <p style="color: #7c3aed; font-size: 12px; word-break: break-all;">
            ${resetUrl}
          </p>
          
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
    `

    // Texto alternativo do email
    const emailText = `Recuperação de Senha - UNICA Benefícios

Olá,

Recebemos uma solicitação para redefinir a senha da sua conta.

Acesse o link abaixo para criar uma nova senha:
${resetUrl}

Este link expira em 1 hora.

Se você não solicitou esta alteração, ignore este email.`

    // Enviar email usando EmailService
    try {
      const emailService = getEmailService()
      
      if (emailService) {
        console.log('[FORGOT-PASSWORD] Enviando email para:', user.email)
        
        await emailService.sendEmail({
          to: user.email,
          subject: 'Recuperação de Senha - UNICA Benefícios',
          html: emailHtml,
          text: emailText
        })

        console.log('[FORGOT-PASSWORD] Email enviado com sucesso!')
      } else {
        console.warn('[FORGOT-PASSWORD] EmailService não configurado - RESEND_API_KEY não definida')
        console.log('[FORGOT-PASSWORD] Reset URL (debug):', resetUrl)
      }

    } catch (emailError) {
      console.error('[FORGOT-PASSWORD] Erro ao enviar email:', emailError)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Se o email existir, você receberá as instruções'
    })

  } catch (error) {
    console.error('[FORGOT-PASSWORD] Erro geral:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
