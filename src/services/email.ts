/**
 * Serviço de integração com Resend (Email)
 * Documentação: https://resend.com/docs
 */

interface EmailConfig {
  apiKey: string
  fromEmail?: string
  fromName?: string
}

interface SendEmailData {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
}

interface EmailResponse {
  id: string
}

interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

class EmailService {
  private apiKey: string
  private fromEmail: string
  private fromName: string
  private baseUrl = 'https://api.resend.com'

  constructor(config: EmailConfig) {
    this.apiKey = config.apiKey
    this.fromEmail = config.fromEmail || 'noreply@unica.com.br'
    this.fromName = config.fromName || 'Unica Clube de Benefícios'
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Erro ${response.status}`)
    }

    return response.json()
  }

  /**
   * Enviar email
   */
  async sendEmail(data: SendEmailData): Promise<EmailResponse> {
    return this.request<EmailResponse>('/emails', {
      method: 'POST',
      body: JSON.stringify({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: Array.isArray(data.to) ? data.to : [data.to],
        subject: data.subject,
        html: data.html,
        text: data.text,
        reply_to: data.replyTo,
      }),
    })
  }

  /**
   * Email de boas-vindas
   */
  async sendWelcomeEmail(
    to: string,
    data: { name: string; planName: string }
  ): Promise<EmailResponse> {
    const template = this.getWelcomeTemplate(data)
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }

  /**
   * Email de confirmação de compra
   */
  async sendPurchaseEmail(
    to: string,
    data: {
      name: string
      partnerName: string
      amount: number
      pointsUsed: number
      cashbackGenerated: number
      date: string
    }
  ): Promise<EmailResponse> {
    const template = this.getPurchaseTemplate(data)
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }

  /**
   * Email de lembrete de pagamento
   */
  async sendPaymentReminderEmail(
    to: string,
    data: { name: string; dueDate: string; amount: number }
  ): Promise<EmailResponse> {
    const template = this.getPaymentReminderTemplate(data)
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }

  /**
   * Email de confirmação de pagamento
   */
  async sendPaymentConfirmationEmail(
    to: string,
    data: { name: string; amount: number; planName: string; nextDueDate: string }
  ): Promise<EmailResponse> {
    const template = this.getPaymentConfirmationTemplate(data)
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }

  // Templates

  private getWelcomeTemplate(data: { name: string; planName: string }): EmailTemplate {
    return {
      subject: '🎉 Bem-vindo ao Unica Clube de Benefícios!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .highlight { background: #7c3aed; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bem-vindo!</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${data.name}</strong>!</p>
              <p>Sua assinatura do plano <span class="highlight">${data.planName}</span> foi ativada com sucesso.</p>
              <p>Agora você pode aproveitar descontos exclusivos em nossos parceiros!</p>
              <p>Acesse o aplicativo para ver todos os benefícios disponíveis para você.</p>
              <p>Qualquer dúvida, estamos à disposição.</p>
              <p>Abraços,<br><strong>Equipe Unica</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Unica Clube de Benefícios - Grupo Zan Norte</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Bem-vindo ao Unica Clube de Benefícios!\n\nOlá, ${data.name}!\n\nSua assinatura do plano ${data.planName} foi ativada com sucesso.\n\nAbraços,\nEquipe Unica`,
    }
  }

  private getPurchaseTemplate(data: {
    name: string
    partnerName: string
    amount: number
    pointsUsed: number
    cashbackGenerated: number
    date: string
  }): EmailTemplate {
    return {
      subject: '🛒 Compra Registrada - Unica Clube',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .details { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .row:last-child { border-bottom: none; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛒 Compra Registrada</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${data.name}</strong>!</p>
              <p>Sua compra foi registrada com sucesso.</p>
              <div class="details">
                <div class="row"><span>Parceiro:</span><strong>${data.partnerName}</strong></div>
                <div class="row"><span>Valor:</span><strong>R$ ${data.amount.toFixed(2)}</strong></div>
                ${data.pointsUsed > 0 ? `<div class="row"><span>Pontos usados:</span><strong>${data.pointsUsed}</strong></div>` : ''}
                ${data.cashbackGenerated > 0 ? `<div class="row"><span>Cashback gerado:</span><strong style="color: #10b981;">R$ ${data.cashbackGenerated.toFixed(2)}</strong></div>` : ''}
                <div class="row"><span>Data:</span><strong>${data.date}</strong></div>
              </div>
              <p>Obrigado por usar o Unica Clube!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Unica Clube de Benefícios - Grupo Zan Norte</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Compra Registrada\n\nOlá, ${data.name}!\n\nParceiro: ${data.partnerName}\nValor: R$ ${data.amount.toFixed(2)}\n\nObrigado por usar o Unica Clube!`,
    }
  }

  private getPaymentReminderTemplate(data: {
    name: string
    dueDate: string
    amount: number
  }): EmailTemplate {
    return {
      subject: '⚠️ Lembrete de Pagamento - Unica Clube',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #fbbf24); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Lembrete de Pagamento</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${data.name}</strong>!</p>
              <div class="alert">
                <p><strong>Sua assinatura vence em ${data.dueDate}</strong></p>
                <p>Valor: R$ ${data.amount.toFixed(2)}</p>
              </div>
              <p>Mantenha sua assinatura ativa para continuar aproveitando os benefícios exclusivos!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Unica Clube de Benefícios - Grupo Zan Norte</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Lembrete de Pagamento\n\nOlá, ${data.name}!\n\nSua assinatura vence em ${data.dueDate}.\nValor: R$ ${data.amount.toFixed(2)}\n\nMantenha sua assinatura ativa!`,
    }
  }

  private getPaymentConfirmationTemplate(data: {
    name: string
    amount: number
    planName: string
    nextDueDate: string
  }): EmailTemplate {
    return {
      subject: '✅ Pagamento Confirmado - Unica Clube',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #34d399); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Pagamento Confirmado</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${data.name}</strong>!</p>
              <div class="success">
                <p>Seu pagamento foi confirmado com sucesso!</p>
                <p>Plano: <strong>${data.planName}</strong></p>
                <p>Valor: <strong>R$ ${data.amount.toFixed(2)}</strong></p>
                <p>Próximo vencimento: <strong>${data.nextDueDate}</strong></p>
              </div>
              <p>Continue aproveitando todos os benefícios do Unica Clube!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Unica Clube de Benefícios - Grupo Zan Norte</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Pagamento Confirmado\n\nOlá, ${data.name}!\n\nSeu pagamento de R$ ${data.amount.toFixed(2)} foi confirmado.\nPlano: ${data.planName}\nPróximo vencimento: ${data.nextDueDate}`,
    }
  }

  /**
   * Testar conexão
   */
  async testConnection(): Promise<boolean> {
    try {
      // Resend não tem endpoint de verificação, tentamos enviar para domínio inexistente
      // A API vai retornar erro mas validar a autenticação
      await this.request('/emails', {
        method: 'POST',
        body: JSON.stringify({
          from: `Test <${this.fromEmail}>`,
          to: ['test@test.local'],
          subject: 'Test',
          text: 'Test',
        }),
      })
      return true
    } catch (error) {
      // Se o erro for de domínio/destinatário, a conexão está OK
      if (error instanceof Error && error.message.includes('domain')) {
        return true
      }
      return false
    }
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null

export function getEmailService(): EmailService | null {
  if (!emailServiceInstance && process.env.RESEND_API_KEY) {
    emailServiceInstance = new EmailService({
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.EMAIL_FROM,
      fromName: process.env.EMAIL_FROM_NAME,
    })
  }
  return emailServiceInstance
}

export function initEmailService(config: EmailConfig): EmailService {
  emailServiceInstance = new EmailService(config)
  return emailServiceInstance
}

export { EmailService, type EmailConfig, type SendEmailData, type EmailResponse }

