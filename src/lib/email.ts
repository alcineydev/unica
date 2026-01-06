import { resend, emailConfig } from './resend'
import { VerificationCodeEmail } from '@/emails/verification-code'
import { WelcomeEmail } from '@/emails/welcome'
import { PasswordResetEmail } from '@/emails/password-reset'

export async function sendVerificationCode(
  email: string,
  name: string,
  code: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: email,
      subject: `${code} é seu código de verificação - UNICA`,
      react: VerificationCodeEmail({ name, code }),
    })

    if (error) {
      console.error('Erro ao enviar e-mail de verificação:', error)
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error)
    return { success: false, error }
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
  planName?: string
) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.unicabeneficios.com.br'

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: email,
      subject: 'Bem-vindo ao UNICA Clube de Benefícios! 🎉',
      react: WelcomeEmail({ name, planName, appUrl }),
    })

    if (error) {
      console.error('Erro ao enviar e-mail de boas-vindas:', error)
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.unicabeneficios.com.br'
    const resetLink = `${appUrl}/redefinir-senha?token=${token}`

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: email,
      subject: 'Redefinir senha - UNICA',
      react: PasswordResetEmail({ name, resetLink }),
    })

    if (error) {
      console.error('Erro ao enviar e-mail de reset:', error)
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error)
    return { success: false, error }
  }
}
