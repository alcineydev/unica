import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY não configurada')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const emailConfig = {
  from: process.env.EMAIL_FROM || 'UNICA <noreply@unicabeneficios.com.br>',
  replyTo: 'suporte@unicabeneficios.com.br',
}
