import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // IMPORTANTE: Sempre retornar sucesso por segurança
    // Não revelar se o email existe ou não no sistema
    if (!user) {
      console.log('[FORGOT-PASSWORD] Email não encontrado:', email)
      // Retorna sucesso mesmo assim para não revelar se email existe
      return NextResponse.json({ 
        success: true,
        message: 'Se o email existir em nossa base, você receberá as instruções de recuperação.' 
      })
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      console.log('[FORGOT-PASSWORD] Usuário inativo:', email)
      return NextResponse.json({ 
        success: true,
        message: 'Se o email existir em nossa base, você receberá as instruções de recuperação.' 
      })
    }

    // Log para debug (remover em produção ou usar logger adequado)
    console.log('[FORGOT-PASSWORD] Solicitação de reset para:', email)
    console.log('[FORGOT-PASSWORD] User ID:', user.id)
    console.log('[FORGOT-PASSWORD] Role:', user.role)

    // TODO: Implementar envio de email
    // 
    // Opções de integração:
    // 1. Resend (recomendado para Vercel)
    // 2. SendGrid
    // 3. Nodemailer com SMTP
    // 4. WhatsApp via Evolution API
    //
    // Fluxo sugerido:
    // 1. Gerar token único (crypto.randomBytes)
    // 2. Salvar token com expiração no banco
    // 3. Enviar email com link: /redefinir-senha?token=xxx
    // 4. Na página de redefinir, validar token e permitir nova senha

    // Por enquanto, retorna sucesso sem enviar email
    // O usuário receberá feedback visual positivo
    return NextResponse.json({ 
      success: true,
      message: 'Se o email existir em nossa base, você receberá as instruções de recuperação.'
    })

  } catch (error) {
    console.error('[FORGOT-PASSWORD] Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação. Tente novamente.' },
      { status: 500 }
    )
  }
}
