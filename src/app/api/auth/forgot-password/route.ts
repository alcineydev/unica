import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEmailService } from '@/services/email'
import crypto from 'crypto'

// Função para detectar URL base
function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get('host')
  const protocol = req.headers.get('x-forwarded-proto') || 'https'

  if (host && host.includes('unicabeneficios.com.br')) {
    return `${protocol}://${host}`
  }

  if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.trim() !== '') {
    return process.env.NEXTAUTH_URL.trim()
  }

  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_APP_URL.trim()
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return 'https://app.unicabeneficios.com.br'
}

export async function POST(request: NextRequest) {
  console.log('[FORGOT-PASSWORD] ========== INICIANDO ==========')

  try {
    // ETAPA 1: Parse do body
    console.log('[FORGOT-PASSWORD] Etapa 1: Parsing body...')
    let body
    try {
      body = await request.json()
      console.log('[FORGOT-PASSWORD] Etapa 1: OK - Body parsed')
    } catch (parseError) {
      console.error('[FORGOT-PASSWORD] Etapa 1: ERRO no parse do body:', parseError)
      return NextResponse.json({ error: 'Erro ao ler requisição' }, { status: 400 })
    }

    const { email } = body
    console.log('[FORGOT-PASSWORD] Email recebido:', email ? email.substring(0, 3) + '***' : 'vazio')

    if (!email) {
      console.log('[FORGOT-PASSWORD] Email vazio')
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    // Validar formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('[FORGOT-PASSWORD] Email inválido')
      return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 })
    }

    // ETAPA 2: Buscar usuário
    console.log('[FORGOT-PASSWORD] Etapa 2: Buscando usuário...')
    let user
    try {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      })
      console.log('[FORGOT-PASSWORD] Etapa 2: OK - Usuário:', user ? 'encontrado' : 'não encontrado')
    } catch (dbError) {
      console.error('[FORGOT-PASSWORD] Etapa 2: ERRO ao buscar usuário:', dbError)
      return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 })
    }

    // Sempre retornar sucesso por segurança
    if (!user) {
      console.log('[FORGOT-PASSWORD] Usuário não existe, retornando sucesso fake')
      return NextResponse.json({
        success: true,
        message: 'Se o email existir, você receberá as instruções'
      })
    }

    // ETAPA 3: Invalidar tokens anteriores
    console.log('[FORGOT-PASSWORD] Etapa 3: Invalidando tokens anteriores...')
    try {
      await prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          used: false
        },
        data: { used: true }
      })
      console.log('[FORGOT-PASSWORD] Etapa 3: OK')
    } catch (tokenError) {
      console.error('[FORGOT-PASSWORD] Etapa 3: ERRO ao invalidar tokens:', tokenError)
      // Continuar mesmo com erro aqui
    }

    // ETAPA 4: Gerar token
    console.log('[FORGOT-PASSWORD] Etapa 4: Gerando token...')
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
    console.log('[FORGOT-PASSWORD] Etapa 4: OK - Token gerado')

    // ETAPA 5: Salvar token no banco
    console.log('[FORGOT-PASSWORD] Etapa 5: Salvando token no banco...')
    try {
      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt
        }
      })
      console.log('[FORGOT-PASSWORD] Etapa 5: OK - Token salvo')
    } catch (createError: any) {
      console.error('[FORGOT-PASSWORD] Etapa 5: ERRO ao criar token:', createError)
      console.error('[FORGOT-PASSWORD] Etapa 5: Código do erro:', createError?.code)
      console.error('[FORGOT-PASSWORD] Etapa 5: Mensagem:', createError?.message)
      return NextResponse.json({ error: 'Erro ao criar token de recuperação' }, { status: 500 })
    }

    // ETAPA 6: Montar URL
    console.log('[FORGOT-PASSWORD] Etapa 6: Montando URL...')
    const baseUrl = getBaseUrl(request)
    const resetUrl = `${baseUrl}/redefinir-senha?token=${token}`
    console.log('[FORGOT-PASSWORD] Etapa 6: OK - Base URL:', baseUrl)

    // ETAPA 7: Preparar email
    console.log('[FORGOT-PASSWORD] Etapa 7: Preparando email...')
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #7c3aed;">UNICA Benefícios</h1>
        <div style="background: #f8fafc; border-radius: 12px; padding: 30px;">
          <h2>Recuperação de Senha</h2>
          <p>Olá,</p>
          <p>Clique no botão abaixo para criar uma nova senha:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Redefinir Minha Senha
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px;">Link: ${resetUrl}</p>
          <p style="color: #64748b; font-size: 14px;">Este link expira em 1 hora.</p>
        </div>
      </body>
      </html>
    `

    // ETAPA 8: Enviar email
    console.log('[FORGOT-PASSWORD] Etapa 8: Enviando email...')
    console.log('[FORGOT-PASSWORD] Etapa 8: RESEND_API_KEY existe?', !!process.env.RESEND_API_KEY)
    console.log('[FORGOT-PASSWORD] Etapa 8: EMAIL_FROM:', process.env.EMAIL_FROM || 'não definido')

    try {
      const emailService = getEmailService()
      console.log('[FORGOT-PASSWORD] Etapa 8: EmailService obtido')

      await emailService.sendEmail({
        to: user.email,
        subject: 'Recuperação de Senha - UNICA Benefícios',
        html: emailHtml,
        text: `Acesse ${resetUrl} para redefinir sua senha.`
      })

      console.log('[FORGOT-PASSWORD] Etapa 8: OK - Email enviado!')
    } catch (emailError: any) {
      console.error('[FORGOT-PASSWORD] Etapa 8: ERRO ao enviar email:', emailError)
      console.error('[FORGOT-PASSWORD] Etapa 8: Tipo:', typeof emailError)
      console.error('[FORGOT-PASSWORD] Etapa 8: Mensagem:', emailError?.message)
      console.error('[FORGOT-PASSWORD] Etapa 8: Stack:', emailError?.stack)
      // NÃO retornar erro - o token já foi criado, apenas logar
    }

    console.log('[FORGOT-PASSWORD] ========== SUCESSO ==========')
    return NextResponse.json({
      success: true,
      message: 'Se o email existir, você receberá as instruções'
    })

  } catch (error: any) {
    console.error('[FORGOT-PASSWORD] ========== ERRO GERAL ==========')
    console.error('[FORGOT-PASSWORD] Tipo:', typeof error)
    console.error('[FORGOT-PASSWORD] Mensagem:', error?.message)
    console.error('[FORGOT-PASSWORD] Stack:', error?.stack)
    console.error('[FORGOT-PASSWORD] Erro completo:', JSON.stringify(error, null, 2))

    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
