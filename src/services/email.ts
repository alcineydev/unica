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
    // Extrair apenas o email se vier no formato "Nome <email@example.com>"
    this.fromEmail = this.extractEmail(config.fromEmail) || 'noreply@unicabeneficios.com.br'
    this.fromName = config.fromName || 'UNICA Benefícios'
  }

  /**
   * Extrai apenas o endereço de email de uma string
   * Aceita: "email@example.com" ou "Nome <email@example.com>"
   */
  private extractEmail(input?: string): string | null {
    if (!input) return null
    
    // Se já é só o email (sem < >), retorna como está
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailRegex.test(input.trim())) {
      return input.trim()
    }
    
    // Se está no formato "Nome <email@example.com>", extrai o email
    const match = input.match(/<([^>]+)>/)
    if (match && match[1]) {
      return match[1].trim()
    }
    
    return null
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

  /**
   * Email de boas-vindas para parceiro com credenciais de acesso
   */
  async sendPartnerWelcomeEmail(
    to: string,
    data: {
      partnerName: string
      tradeName: string
      email: string
      password: string
    }
  ): Promise<EmailResponse> {
    const template = this.getPartnerWelcomeTemplate(data)
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }

  // Templates

  private getPartnerWelcomeTemplate(data: {
    partnerName: string
    tradeName: string
    email: string
    password: string
  }): EmailTemplate {
    const loginUrl = process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL}/login`
      : 'https://app.unicabeneficios.com.br/login'

    return {
      subject: `🤝 Bem-vindo ao UNICA Clube de Benefícios, ${data.tradeName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:16px 16px 0 0;padding:40px 30px;text-align:center;">
              <h1 style="color:#ffffff;font-size:28px;margin:0 0 8px;">🤝 Bem-vindo ao UNICA!</h1>
              <p style="color:#e9d5ff;font-size:16px;margin:0;">Clube de Benefícios</p>
            </div>
            <div style="background:#ffffff;padding:30px;border-radius:0 0 16px 16px;">
              <p style="font-size:16px;color:#1f2937;margin:0 0 16px;">
                Olá <strong>${data.partnerName}</strong>,
              </p>
              <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 20px;">
                Sua empresa <strong>${data.tradeName}</strong> foi cadastrada com sucesso como parceira no UNICA Clube de Benefícios! Agora você pode gerenciar seus benefícios e atender nossos assinantes.
              </p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 24px;">
                <h3 style="color:#1f2937;font-size:14px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">
                  🔐 Seus dados de acesso
                </h3>
                <div style="margin:0 0 8px;">
                  <span style="color:#6b7280;font-size:13px;">Email:</span><br>
                  <strong style="color:#1f2937;font-size:15px;">${data.email}</strong>
                </div>
                <div>
                  <span style="color:#6b7280;font-size:13px;">Senha:</span><br>
                  <strong style="color:#1f2937;font-size:15px;">${data.password}</strong>
                </div>
              </div>
              <div style="text-align:center;margin:24px 0;">
                <a href="${loginUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
                  Acessar Painel do Parceiro
                </a>
              </div>
              <div style="border-top:1px solid #f3f4f6;padding-top:20px;margin-top:20px;">
                <h3 style="color:#1f2937;font-size:14px;margin:0 0 12px;">📋 Próximos passos:</h3>
                <div style="font-size:14px;color:#4b5563;line-height:1.8;">
                  1. Faça login no painel do parceiro<br>
                  2. Complete seu perfil (logo, banner, horários)<br>
                  3. Configure seus benefícios para os assinantes<br>
                  4. Comece a receber clientes do clube!
                </div>
              </div>
              <div style="background:#fef3c7;border-radius:8px;padding:12px 16px;margin-top:20px;">
                <p style="font-size:13px;color:#92400e;margin:0;">
                  ⚠️ <strong>Importante:</strong> Recomendamos alterar sua senha no primeiro acesso.
                </p>
              </div>
            </div>
            <div style="text-align:center;padding:20px;color:#9ca3af;font-size:12px;">
              <p>© ${new Date().getFullYear()} UNICA Clube de Benefícios - Grupo Zan Norte</p>
              <p>Este email foi enviado automaticamente.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Bem-vindo ao UNICA Clube de Benefícios!\n\nOlá, ${data.partnerName}!\n\nSua empresa ${data.tradeName} foi cadastrada como parceira.\n\nDados de acesso:\nEmail: ${data.email}\nSenha: ${data.password}\n\nAcesse: ${loginUrl}\n\nRecomendamos trocar sua senha no primeiro acesso.\n\nEquipe UNICA`,
    }
  }

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
          from: `${this.fromName} <${this.fromEmail}>`,
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

